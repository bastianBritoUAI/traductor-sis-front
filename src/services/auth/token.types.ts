export interface OAuthTokenResponse {
  token_type: string
  expires_in: number
  ext_expires_in?: number
  access_token: string
}

export interface TokenApiResponse {
  access_token?: unknown
  accessToken?: unknown
  token_type?: unknown
  tokenType?: unknown
  expires_in?: unknown
  expiresIn?: unknown
}

export interface StoredToken {
  accessToken: string
  tokenType: string
  expiresIn: number
  expirationTimestamp: number
}

export type TokenErrorCode =
  | 'configuration_error'
  | 'invalid_response'
  | 'network_error'
  | 'timeout'
  | 'request_rejected'
  | 'service_unavailable'

export class TokenServiceError extends Error {
  readonly code: TokenErrorCode
  readonly status?: number

  constructor(code: TokenErrorCode, message: string, status?: number) {
    super(message)
    this.name = 'TokenServiceError'
    this.code = code
    this.status = status
  }
}
