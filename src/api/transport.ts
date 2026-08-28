import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { getApiClient } from '../services/api/axios.config'

/**
 * Frontera entre el dominio Swagger y el mecanismo HTTP concreto.
 * Una implementación diferente puede envolverse alrededor de este contrato
 * sin cambiar servicios ni componentes del explorador.
 */
export interface ApiTransport {
  buildUrl: (config: AxiosRequestConfig) => string
  request: <T = unknown>(config: AxiosRequestConfig) => Promise<AxiosResponse<T>>
}

const defaultTransport: ApiTransport = {
  buildUrl: (config) => getApiClient().getUri(config),
  request: <T = unknown>(config: AxiosRequestConfig) => getApiClient().request<T>(config),
}

let activeTransport: ApiTransport = defaultTransport

export function getApiTransport(): ApiTransport {
  return activeTransport
}

export function configureApiTransport(transport: ApiTransport) {
  activeTransport = transport
}
