export interface ChatState {
  streamingContent: string
  isStreaming: boolean
  isRetrieving: boolean
  isThinking: boolean
  hasSentMessage: boolean
  error: string | null
}

export const IDLE_STATE: ChatState = {
  streamingContent: '',
  isStreaming: false,
  isRetrieving: false,
  isThinking: false,
  hasSentMessage: false,
  error: null,
}

export type ChatAction =
  | { type: 'SEND_MESSAGE' }
  | { type: 'RETRIEVING' }
  | { type: 'THINKING_START' }
  | { type: 'THINKING_END' }
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
    case 'THINKING_START':
      return { ...state, isRetrieving: false, isThinking: true }
    case 'THINKING_END':
      return { ...state, isThinking: false }
    case 'TOKEN':
      return {
        ...state,
        isRetrieving: false,
        isThinking: false,
        streamingContent: action.content,
      }
    case 'DONE':
      return IDLE_STATE
    case 'ERROR':
      return { ...IDLE_STATE, error: action.content }
    case 'RESET':
      return IDLE_STATE
  }
}
