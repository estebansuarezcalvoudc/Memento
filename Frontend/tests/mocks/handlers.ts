import { authHandlers } from './authHandlers'
import { conversationHandlers } from './conversationHandlers'
import { meetingHandlers } from './meetingHandlers'
import { chatHandlers } from './settings/chatHandlers'
import { providerHandlers } from './settings/providerHandlers'
import { summarizationHandlers } from './settings/summarizationHandlers'
import { transcriptionHandlers } from './settings/transcriptionHandlers'

export const handlers = [
  ...authHandlers,
  ...chatHandlers,
  ...conversationHandlers,
  ...meetingHandlers,
  ...providerHandlers,
  ...summarizationHandlers,
  ...transcriptionHandlers,
]

export { mockChats } from './conversationHandlers'
export { mockMeetings } from './meetingHandlers'
export { mockProviders } from './settings/providerHandlers'
