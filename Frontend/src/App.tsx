import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Sidebar from './components/layout/sidebar/Sidebar'
import LogIn from './pages/auth/LogIn'
import SignUp from './pages/auth/SignUp'
import Chat from './pages/chat/Chat'
import NewChat from './pages/chat/NewChat'
import Home from './pages/Home'
import MeetingContent from './pages/meetings/MeetingContent'
import Meetings from './pages/meetings/Meetings'
import NotFound from './pages/NotFound'
import { useIsUserAuth } from './stores/authStore'
import { useIsSidebarOpen } from './stores/sidebarStore'
import { useTheme } from './stores/themeStore'

export default function App() {
  const isUserAuth = useIsUserAuth()
  const isSidebarOpen = useIsSidebarOpen()
  // Initializes theme store on app startup so the persisted theme is applied immediately
  useTheme()

  return (
    <BrowserRouter>
      {isUserAuth && <Sidebar />}
      <div
        className={`flex min-h-screen flex-col items-center justify-center bg-white transition-all duration-300 ease-in-out dark:bg-stone-900 ${
          isUserAuth ? (isSidebarOpen ? 'ml-64' : 'ml-16') : 'ml-0'
        }`}
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="login" element={<LogIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="chats/:chatId" element={<Chat />} />
          <Route path="new-chat" element={<NewChat />} />
          <Route path="meetings" element={<Meetings />} />
          <Route
            path="meetings/:meetingId/transcription"
            element={<MeetingContent type="transcription" />}
          />
          <Route
            path="meetings/:meetingId/summary"
            element={<MeetingContent type="summary" />}
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
