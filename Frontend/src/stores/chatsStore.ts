import { create } from 'zustand'

export interface Chat {
  id: string
  started_at?: string
  title: string
}

interface ChatsStore {
  chats: Chat[]
  setChats: (chats: Chat[]) => void
  unshiftChat: (chat: Chat) => void
  deleteChat: (chatId: string) => void
}

const useChatsStore = create<ChatsStore>()(set => ({
  chats: [],
  setChats: chats => set(() => ({ chats: chats })),
  unshiftChat: (newChat: Chat) =>
    set(state => ({
      chats: [newChat, ...state.chats],
    })),
  deleteChat: chatId =>
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
    })),
}))

export const useChats = () => useChatsStore(state => state.chats)
export const useSetChats = () => useChatsStore(state => state.setChats)
export const useUnshiftChat = () => useChatsStore(state => state.unshiftChat)
export const useDeleteChat = () => useChatsStore(state => state.deleteChat)
