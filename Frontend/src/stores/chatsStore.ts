import { create } from 'zustand'

interface Chat {
  id: string
  started_at?: string
  title: string
}

interface ChatsStore {
  chats: Chat[]
  setChats: (chats: Chat[]) => void
  deleteChat: (chatId: string) => void
}

const useChatsStore = create<ChatsStore>()(set => ({
  chats: [],
  setChats: chats => set(() => ({ chats: chats })),
  deleteChat: chatId =>
    set(state => ({
      chats: state.chats.filter(chat => chat.id !== chatId),
    })),
}))

export const useChats = () => useChatsStore(state => state.chats)
export const useSetChats = () => useChatsStore(state => state.setChats)
export const useDeleteChat = () => useChatsStore(state => state.deleteChat)
