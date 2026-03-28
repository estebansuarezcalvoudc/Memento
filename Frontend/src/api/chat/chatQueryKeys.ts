const NO_SESSION_KEY = 'no-session'

export function getAuthSessionKey(): string {
  return localStorage.getItem('access_token') ?? NO_SESSION_KEY
}

export const chatsKey = (sessionKey: string) => ['chats', sessionKey] as const
export const chatKey = (sessionKey: string, id: string) =>
  ['chat', sessionKey, id] as const
