import type { OpenAPIV3 } from 'openapi-types'
import type {
  HttpMethod,
  SwaggerBody,
  SwaggerEndpoint,
  SwaggerParameter,
  SwaggerResponse,
} from '../types/swagger'

const httpMethods = new Set<HttpMethod>([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
])

export function isReferenceObject(value: unknown): value is OpenAPIV3.ReferenceObject {
  return typeof value === 'object' && value !== null && '$ref' in value
}

export function resolveReference<T>(
  document: OpenAPIV3.Document,
  reference: string,
): T | undefined {
  if (!reference.startsWith('#/')) return undefined

  const segments = reference
    .slice(2)
    .split('/')
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'))
  let current: unknown = document

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) return undefined
    current = (current as Record<string, unknown>)[segment]
  }

  return current as T
}

function resolveParameter(
  value: OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject,
  document: OpenAPIV3.Document,
): OpenAPIV3.ParameterObject | undefined {
  return isReferenceObject(value)
    ? resolveReference<OpenAPIV3.ParameterObject>(document, value.$ref)
    : value
}

function extractParameters(
  values: Array<OpenAPIV3.ParameterObject | OpenAPIV3.ReferenceObject>,
  document: OpenAPIV3.Document,
): SwaggerParameter[] {
  const unique = new Map<string, SwaggerParameter>()

  values.forEach((value) => {
    const parameter = resolveParameter(value, document)
    if (!parameter) return
    if (parameter.in === 'header' && parameter.name.toLowerCase() === 'authorization') return

    const media = parameter.content ? Object.values(parameter.content)[0] : undefined
    const schema = parameter.schema ?? media?.schema
    unique.set(`${parameter.in}:${parameter.name}`, {
      name: parameter.name,
      location: parameter.in,
      description: parameter.description,
      required: parameter.required ?? parameter.in === 'path',
      schema,
      example: parameter.example ?? media?.example ?? generateSchemaExample(schema, document),
    })
  })

  return [...unique.values()]
}

function extractRequestBody(
  value: OpenAPIV3.RequestBodyObject | OpenAPIV3.ReferenceObject | undefined,
  document: OpenAPIV3.Document,
): SwaggerBody | undefined {
  if (!value) return undefined
  const body = isReferenceObject(value)
    ? resolveReference<OpenAPIV3.RequestBodyObject>(document, value.$ref)
    : value
  if (!body) return undefined

  const contentType = body.content['application/json']
    ? 'application/json'
    : Object.keys(body.content)[0]
  if (!contentType) return undefined
  const media = body.content[contentType]

  return {
    required: body.required ?? false,
    description: body.description,
    contentType,
    schema: media?.schema,
    example: media?.example ?? generateSchemaExample(media?.schema, document),
  }
}

function extractResponses(
  values: OpenAPIV3.ResponsesObject,
  document: OpenAPIV3.Document,
): SwaggerResponse[] {
  return Object.entries(values).map(([status, value]) => {
    const response = isReferenceObject(value)
      ? resolveReference<OpenAPIV3.ResponseObject>(document, value.$ref)
      : value
    const contentType = response?.content?.['application/json']
      ? 'application/json'
      : Object.keys(response?.content ?? {})[0]
    const media = contentType ? response?.content?.[contentType] : undefined
    const explicitExample = (media?.example ?? Object.values(media?.examples ?? {})[0]) as unknown
    const resolvedExample: unknown = isReferenceObject(explicitExample)
      ? resolveReference<unknown>(document, explicitExample.$ref)
      : explicitExample

    return {
      status,
      description: response?.description ?? 'Sin descripción',
      contentType,
      schema: media?.schema,
      example: resolvedExample ?? generateSchemaExample(media?.schema, document),
    }
  })
}

export function extractEndpoints(document: OpenAPIV3.Document): SwaggerEndpoint[] {
  const endpoints: SwaggerEndpoint[] = []

  Object.entries(document.paths).forEach(([path, pathItemOrRef]) => {
    if (!pathItemOrRef || isReferenceObject(pathItemOrRef)) return
    const pathItem = pathItemOrRef

    Object.entries(pathItem).forEach(([key, candidate]) => {
      if (!httpMethods.has(key as HttpMethod) || !candidate || typeof candidate !== 'object') return
      const method = key as HttpMethod
      const operation = candidate as OpenAPIV3.OperationObject
      const parameters = extractParameters(
        [...(pathItem.parameters ?? []), ...(operation.parameters ?? [])],
        document,
      )
      const tags = operation.tags?.length ? operation.tags : ['General']
      endpoints.push({
        id: `${method.toUpperCase()} ${path}`,
        operationId: operation.operationId,
        method,
        path,
        summary: operation.summary ?? operation.operationId ?? `${method.toUpperCase()} ${path}`,
        description: operation.description,
        tags,
        deprecated: operation.deprecated ?? false,
        parameters,
        requestBody: extractRequestBody(operation.requestBody, document),
        responses: extractResponses(operation.responses, document),
      })
    })
  })

  return endpoints.sort((a, b) => {
    const tagOrder = a.tags[0]?.localeCompare(b.tags[0] ?? '') ?? 0
    return tagOrder || a.path.localeCompare(b.path) || a.method.localeCompare(b.method)
  })
}

export function generateSchemaExample(
  schemaOrReference: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
  document: OpenAPIV3.Document,
  visited = new Set<string>(),
): unknown {
  if (!schemaOrReference) return undefined

  let schema = schemaOrReference
  if (isReferenceObject(schema)) {
    if (visited.has(schema.$ref)) return {}
    visited.add(schema.$ref)
    const resolved = resolveReference<OpenAPIV3.SchemaObject>(document, schema.$ref)
    if (!resolved) return undefined
    schema = resolved
  }

  if (schema.example !== undefined) return schema.example
  if (schema.default !== undefined) return schema.default
  if (schema.enum?.length) return schema.enum[0]

  const composition = schema.oneOf ?? schema.anyOf ?? schema.allOf
  if (composition?.length) {
    if (schema.allOf) {
      return composition.reduce<Record<string, unknown>>((accumulator, part) => {
        const value = generateSchemaExample(part, document, new Set(visited))
        return value && typeof value === 'object' && !Array.isArray(value)
          ? { ...accumulator, ...value }
          : accumulator
      }, {})
    }
    return generateSchemaExample(composition[0], document, visited)
  }

  if (schema.type === 'object' || schema.properties) {
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([name, property]) => [
        name,
        generateSchemaExample(property, document, new Set(visited)),
      ]),
    )
  }

  if (schema.type === 'array') {
    const item = generateSchemaExample(schema.items, document, new Set(visited))
    return item === undefined ? [] : [item]
  }

  if (schema.type === 'integer' || schema.type === 'number') return schema.minimum ?? 0
  if (schema.type === 'boolean') return false
  if (schema.format === 'date-time') return new Date(0).toISOString()
  if (schema.format === 'date') return '1970-01-01'
  if (schema.format === 'uuid') return '00000000-0000-0000-0000-000000000000'
  return 'string'
}

export function describeSchema(
  schemaOrReference: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
  document: OpenAPIV3.Document,
  depth = 0,
): unknown {
  if (!schemaOrReference || depth > 5) return undefined
  if (isReferenceObject(schemaOrReference)) {
    const name = schemaOrReference.$ref.split('/').at(-1)
    const resolved = resolveReference<OpenAPIV3.SchemaObject>(document, schemaOrReference.$ref)
    const description = describeSchema(resolved, document, depth + 1)
    return {
      $model: name,
      ...(description && typeof description === 'object' ? description : {}),
    }
  }

  const schema = schemaOrReference
  const result: Record<string, unknown> = {}
  if (schema.type) result.type = schema.type
  if (schema.format) result.format = schema.format
  if (schema.description) result.description = plainText(schema.description)
  if (schema.required?.length) result.required = schema.required
  if (schema.enum) result.enum = schema.enum
  if (schema.nullable) result.nullable = true
  if ('items' in schema && schema.items) {
    result.items = describeSchema(schema.items, document, depth + 1)
  }
  if (schema.properties) {
    result.properties = Object.fromEntries(
      Object.entries(schema.properties).map(([name, property]) => [
        name,
        describeSchema(property, document, depth + 1),
      ]),
    )
  }
  const composition = schema.oneOf ?? schema.anyOf ?? schema.allOf
  if (composition) {
    const key = schema.oneOf ? 'oneOf' : schema.anyOf ? 'anyOf' : 'allOf'
    result[key] = composition.map((part) => describeSchema(part, document, depth + 1))
  }
  return result
}

export function getSchemaType(
  schema: OpenAPIV3.SchemaObject | OpenAPIV3.ReferenceObject | undefined,
): string {
  if (!schema) return '—'
  if (isReferenceObject(schema)) return schema.$ref.split('/').at(-1) ?? 'object'
  if (schema.type === 'array') {
    const item = schema.items
    const itemType = isReferenceObject(item)
      ? item.$ref.split('/').at(-1)
      : item && 'type' in item
        ? item.type
        : 'object'
    return `array<${String(itemType ?? 'object')}>`
  }
  return schema.format
    ? `${String(schema.type)} (${schema.format})`
    : String(schema.type ?? 'object')
}

export function plainText(value?: string): string {
  if (!value) return ''
  return value
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/li>|<\/h\d>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
