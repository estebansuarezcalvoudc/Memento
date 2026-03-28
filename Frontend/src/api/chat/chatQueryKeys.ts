import { getJwtUserId } from '../../auth/jwt'

const NO_SESSION_KEY = 'no-session'

export function getAuthSessionKey(): string {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return NO_SESSION_KEY
  }

  return getJwtUserId(token) ?? NO_SESSION_KEY
}

export const chatsKey = (sessionKey: string) => ['chats', sessionKey] as const
export const chatKey = (sessionKey: string, id: string) =>
  ['chat', sessionKey, id] as const
