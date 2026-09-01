import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { afterEach, describe, expect, it } from 'vitest'
import { configureApiTransport, getApiTransport } from '../api/transport'
import type { SwaggerEndpoint } from '../types/swagger'
import { executeEndpoint } from './endpointService'

const originalTransport = getApiTransport()

const binaryEndpoint: SwaggerEndpoint = {
  id: 'GET /reports/export',
  method: 'get',
  path: '/reports/export',
  summary: 'Exportar reporte',
  tags: ['Reportes'],
  deprecated: false,
  parameters: [],
  responses: [
    {
      status: '200',
      description: 'Archivo Excel',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    },
  ],
}

afterEach(() => configureApiTransport(originalTransport))

describe('executeEndpoint', () => {
  it('converts declared binary responses into downloadable files', async () => {
    let requestConfig: AxiosRequestConfig | undefined
    configureApiTransport({
      buildUrl: () => 'https://api.example.test/reports/export',
      request: async (config) => {
        requestConfig = config
        return {
          data: new Blob(['spreadsheet'], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          }),
          status: 200,
          statusText: 'OK',
          headers: {
            'content-type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'content-disposition': "attachment; filename*=UTF-8''reporte%20final.xlsx",
          },
          config,
        } as AxiosResponse
      },
    })

    const result = await executeEndpoint({ endpoint: binaryEndpoint, parameters: {} })

    expect(requestConfig?.responseType).toBe('blob')
    expect(requestConfig?.headers).toMatchObject({
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(result.download).toMatchObject({
      filename: 'reporte final.xlsx',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    })
    expect(result.download?.blob.size).toBe(11)
  })
})
