import { type Chat, type Message } from '../types/chats'
import fetchBackend from './fetchBackend'

export type { Chat, Message }

export async function getAllChats(): Promise<Chat[]> {
  return fetchBackend('GET', 'conversations')
}

export async function getChat(id: string): Promise<Message[]> {
  return fetchBackend('GET', `conversations/${id}`)
}

export async function createChat(message: string): Promise<Chat> {
  return fetchBackend('POST', 'conversations', { message })
}

export async function sendMessage(
  id: string,
  message: string,
): Promise<string> {
  return fetchBackend('POST', `conversations/${id}/chat`, { message })
}

export async function updateChatTitle(
  id: string,
  title: string,
): Promise<null> {
  return fetchBackend('PUT', `conversations/${id}`, { title })
}

export async function deleteChat(id: string): Promise<null> {
  return fetchBackend('DELETE', `conversations/${id}`)
}
