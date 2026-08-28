import { TOKEN_EXPIRATION_BUFFER_MS } from './token.constants'
import type { StoredToken } from './token.types'

let tokenInMemory: StoredToken | undefined

export function getStoredToken(): Readonly<StoredToken> | undefined {
  return tokenInMemory
}

export function storeToken(token: StoredToken) {
  tokenInMemory = token
}

export function clearStoredToken() {
  tokenInMemory = undefined
}

export function isStoredTokenValid(
  now = Date.now(),
  expirationBufferMs = TOKEN_EXPIRATION_BUFFER_MS,
): boolean {
  return Boolean(
    tokenInMemory?.accessToken && tokenInMemory.expirationTimestamp - expirationBufferMs > now,
  )
}
