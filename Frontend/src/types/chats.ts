export interface Chat {
  id: string
  title: string
  startedAt?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
