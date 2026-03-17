export interface Chat {
  id: string
  title: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}
