function decodeJwtPayload(token: string): null | Record<string, unknown> {
  try {
    const [, payloadPart] = token.split('.')
    if (!payloadPart) {
      return null
    }

    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const json = atob(padded)
    return JSON.parse(json) as Record<string, unknown>
  } catch {
    return null
  }
}

export function getJwtUserId(token: string): null | string {
  const payload = decodeJwtPayload(token)
  const userId = payload?.sub
  if (typeof userId !== 'string') {
    return null
  }

  const trimmed = userId.trim()
  return trimmed === '' ? null : trimmed
}

export function getJwtEmail(token: string): null | string {
  const payload = decodeJwtPayload(token)
  const email = payload?.email
  if (typeof email !== 'string') {
    return null
  }

  const trimmed = email.trim()
  return trimmed === '' ? null : trimmed
}
