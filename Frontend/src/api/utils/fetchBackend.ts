import camelcaseKeys from 'camelcase-keys'

export class HttpError extends Error {
  constructor(public status: number, message?: string) {
    super(message ?? `HTTP error! status: ${status}`)
  }
}


type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export default async function fetchBackend<T>(
  method: Method,
  url: string,
  body?: T,
) {
  const token = localStorage.getItem('access_token')

  const isFormData = body instanceof FormData

  const headers: HeadersInit = {}

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  // Only add Content-Type for JSON
  if (!isFormData && body !== undefined) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`/api/${url}`, {
    method,
    headers,
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    const body = await response.json().catch(() => null)
    throw new HttpError(response.status, body?.detail ?? undefined)
  }

  if (response.status === 204) {
    return null
  }

  return camelcaseKeys(await response.json(), { deep: true })
}
