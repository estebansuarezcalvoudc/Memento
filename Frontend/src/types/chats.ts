export interface Chat {
  id: string
  title?: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export type StreamStatus = 'idle' | 'retrieving' | 'thinking' | 'streaming'

export interface ConversationStreamState {
  status: StreamStatus
  partialReply: string
  updatedAt: null | string
  error: null | string
}

export interface ConversationDialogueResponse {
  messages: Message[]
  state: ConversationStreamState
}
