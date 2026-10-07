// Relative URLs: in development the Vite dev server proxies /api to the backend (see vite.config.ts).
export const API_BASE_URL = ''

interface FetchJsonOptions extends Omit<RequestInit, 'body'> {
  body?: unknown
}

export async function fetchJson<T>(
  path: string,
  options: FetchJsonOptions = {},
): Promise<T> {
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
    ...options,
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

    throw new Error(errorMessage)
  }

  const responseText = await response.text()
  if (!responseText) {
    return undefined as T
  }

  return JSON.parse(responseText) as T
}
