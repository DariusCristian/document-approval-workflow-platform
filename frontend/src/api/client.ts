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
