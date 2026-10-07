// Relative URLs: in development the Vite dev server proxies /api to the backend (see vite.config.ts).
export const API_BASE_URL = ''

interface FetchJsonOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
  // Set for requests that handle 401 themselves (login with a wrong password, the session check on load).
  skipUnauthorizedHandler?: boolean
}

// An error response from the API, with its HTTP status (e.g. 401, 403) and the server's message.
export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

let unauthorizedHandler: (() => void) | null = null

// CSRF protection: the server puts a token in this cookie, and every state-changing
// request must send it back in this header (another site can't read our cookies).
const CSRF_COOKIE_NAME = 'XSRF-TOKEN'
const CSRF_HEADER_NAME = 'X-XSRF-TOKEN'
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']

function readCookie(name: string): string | null {
  const prefix = `${name}=`
  const cookie = document.cookie.split('; ').find((part) => part.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

// Returns the current CSRF token, asking the server for one first if there is none yet
// (e.g. before the very first login). Read fresh each time: login and logout replace it.
async function getCsrfToken(): Promise<string | null> {
  const token = readCookie(CSRF_COOKIE_NAME)
  if (token) {
    return token
  }

  await fetch(`${API_BASE_URL}/api/auth/csrf`, { credentials: 'include' })
  return readCookie(CSRF_COOKIE_NAME)
}

// Called whenever a request gets 401 (the session expired or is missing). Set by AuthProvider.
export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler
}

export async function fetchJson<T>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<T> {
  const { skipUnauthorizedHandler, ...requestOptions } = options
  const headers = new Headers(options.headers)
  headers.set('Accept', 'application/json')

  const method = (options.method ?? 'GET').toUpperCase()
  if (CSRF_PROTECTED_METHODS.includes(method)) {
    const csrfToken = await getCsrfToken()
    if (csrfToken) {
      headers.set(CSRF_HEADER_NAME, csrfToken)
    }
  }

  const inputBody = options.body
  let body: BodyInit | null | undefined

  const isBodyInitType =
    typeof inputBody === 'string' ||
    inputBody instanceof FormData ||
    inputBody instanceof URLSearchParams ||
    inputBody instanceof Blob ||
    inputBody instanceof ArrayBuffer ||
    ArrayBuffer.isView(inputBody)

  if (inputBody === undefined || inputBody === null) {
    body = inputBody
  } else if (isBodyInitType) {
    body = inputBody as BodyInit
  } else {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(inputBody)
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...requestOptions,
    credentials: options.credentials ?? 'include',
    headers,
    body,
  })

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`
    const rawError = await response.text()

    if (rawError) {
      try {
        const errorData = JSON.parse(rawError) as { message?: string }
        if (errorData.message) {
          errorMessage = errorData.message
        } else {
          errorMessage = rawError
        }
      } catch {
        errorMessage = rawError
      }
    }

    if (response.status === 401 && !skipUnauthorizedHandler) {
      unauthorizedHandler?.()
    }

    throw new ApiError(response.status, errorMessage)
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}
