import { getHttpStatusMessage, getRequestErrorMessage } from '../utils/httpErrors'
import { getApiClient } from './api/axios.config'

export interface ApiHealth {
  available: boolean
  status?: number
  message: string
  checkedAt: number
}

export async function checkApiAvailability(): Promise<ApiHealth> {
  try {
    const response = await getApiClient().get('', {
      timeout: 8_000,
      validateStatus: () => true,
    })
    const available = response.status < 500
    return {
      available,
      status: response.status,
      message: available
        ? `Servidor accesible (HTTP ${response.status})`
        : getHttpStatusMessage(response.status),
      checkedAt: Date.now(),
    }
  } catch (error) {
    return {
      available: false,
      message: getRequestErrorMessage(error, 'API'),
      checkedAt: Date.now(),
    }
  }
}
