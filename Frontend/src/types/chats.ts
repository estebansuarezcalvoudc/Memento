export interface Chat {
  id: string
  title: string
  started_at?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
