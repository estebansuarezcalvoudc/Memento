export interface ChatState {
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  hasSentMessage: boolean
  error: string | null
}

export const IDLE_STATE: ChatState = {
  streamingContent: '',
  isStreaming: false,
  isRetrieving: false,
  hasSentMessage: false,
  error: null,
}

export type ChatAction =
  | { type: 'SEND_MESSAGE' }
  | { type: 'RETRIEVING' }
  | { type: 'TOKEN'; content: string }
  | { type: 'DONE' }
  | { type: 'ERROR'; content: string }
  | { type: 'RESET' }

export function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SEND_MESSAGE':
      return { ...IDLE_STATE, isStreaming: true, hasSentMessage: true }
    case 'RETRIEVING':
      return { ...state, isRetrieving: true }
    case 'TOKEN':
      return { ...state, isRetrieving: false, streamingContent: action.content }
    case 'DONE':
      return IDLE_STATE
    case 'ERROR':
      return { ...IDLE_STATE, error: action.content }
    case 'RESET':
      return IDLE_STATE
  }
}
