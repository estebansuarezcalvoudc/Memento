import camelcaseKeys from 'camelcase-keys'

export class HttpError extends Error {
  constructor(public status: number) {
    super(`HTTP error! status: ${status}`)
  }
}



export default async function fetchBackend<T>(
  method: method,
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
    throw new HttpError(response.status)
  }

  if (response.status === 204) {
    return null
  }

  return camelcaseKeys(await response.json(), { deep: true })
}
