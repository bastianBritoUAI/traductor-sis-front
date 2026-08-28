import type { OpenAPIV3 } from 'openapi-types'
import { describe, expect, it } from 'vitest'
import { describeSchema, extractEndpoints, generateSchemaExample } from './openapi'

const document = {
  openapi: '3.0.1',
  info: { title: 'API de prueba', version: 'v1' },
  paths: {
    '/people/{id}': {
      parameters: [
        {
          name: 'id',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
      get: {
        tags: ['People'],
        summary: 'Consultar persona',
        parameters: [
          {
            name: 'verbose',
            in: 'query',
            schema: { type: 'boolean', default: false },
          },
          {
            name: 'Authorization',
            in: 'header',
            schema: { type: 'string' },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/Person' } },
            },
          },
        },
      },
    },
    '/people': {
      post: {
        tags: ['People'],
        summary: 'Crear persona',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/Person' } },
          },
        },
        responses: { '201': { description: 'Created' } },
      },
    },
  },
  components: {
    schemas: {
      Person: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'Ada' },
          active: { type: 'boolean' },
        },
      },
    },
  },
} as OpenAPIV3.Document

describe('OpenAPI utilities', () => {
  it('extracts operations and inherited parameters', () => {
    const endpoints = extractEndpoints(document)
    const getPerson = endpoints.find((endpoint) => endpoint.method === 'get')
    const createPerson = endpoints.find((endpoint) => endpoint.method === 'post')

    expect(endpoints).toHaveLength(2)
    expect(getPerson?.parameters.map((parameter) => parameter.name)).toEqual(['id', 'verbose'])
    expect(createPerson?.requestBody?.required).toBe(true)
  })

  it('generates request examples through local references', () => {
    expect(generateSchemaExample({ $ref: '#/components/schemas/Person' }, document)).toEqual({
      name: 'Ada',
      active: false,
    })
  })

  it('describes referenced models and required fields', () => {
    expect(describeSchema({ $ref: '#/components/schemas/Person' }, document)).toMatchObject({
      $model: 'Person',
      type: 'object',
      required: ['name'],
    })
  })
})
