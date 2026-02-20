import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Sidebar from './components/side-bar/Sidebar'
import Chat from './pages/Chat'
import Home from './pages/Home'
import LogIn from './pages/LogIn'
import MeetingContent from './pages/MeetingContent'
import Meetings from './pages/Meetings'
import NewChat from './pages/NewChat'
import NotFound from './pages/NotFound'
import SignUp from './pages/SignUp'
import { useIsUserAuth } from './stores/authStore'
import { useIsSidebarOpen } from './stores/sidebarStore'

export default function App() {
  const isUserAuth = useIsUserAuth()
  const isSidebarOpen = useIsSidebarOpen()

  return (
    <BrowserRouter>
      {isUserAuth && <Sidebar />}
      <div
        className={`flex min-h-screen flex-col items-center justify-center transition-all duration-300 ease-in-out ${
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
