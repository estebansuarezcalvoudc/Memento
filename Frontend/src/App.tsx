import { useEffect } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'

import { verifyToken } from './api/authAPI'
import AuthGuard from './components/layout/AuthGuard'
import ProtectedRoute from './components/layout/ProtectedRoute'
import PublicOnlyRoute from './components/layout/PublicOnlyRoute'
import Sidebar from './components/layout/sidebar/Sidebar'
import LogIn from './pages/auth/LogIn'
import SignUp from './pages/auth/SignUp'
import Chat from './pages/chat/Chat'
import Home from './pages/Home'
import MeetingContent from './pages/meetings/MeetingContent'
import Meetings from './pages/meetings/Meetings'
import NotFound from './pages/NotFound'
import {
  useIsAuthInitialized,
  useIsUserAuth,
  useSetAuthInitialized,
  useSetIsUserAuth,
} from './stores/authStore'
import { useIsSidebarOpen } from './stores/sidebarStore'

export default function App() {
  const authInitialized = useIsAuthInitialized()
  const isUserAuth = useIsUserAuth()
  const setIsUserAuth = useSetIsUserAuth()
  const setAuthInitialized = useSetAuthInitialized()
  const isSidebarOpen = useIsSidebarOpen()

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      verifyToken()
        .then(() => setIsUserAuth(true))
        .catch(() => localStorage.removeItem('access_token'))
        .finally(() => setAuthInitialized(true))
    } else {
      setAuthInitialized(true)
    }
  }, [setIsUserAuth, setAuthInitialized])

  if (!authInitialized) {
    return (
      <div
        aria-label="Loading"
        className="flex h-screen items-center justify-center text-stone-700 dark:text-stone-300"
      >
        <ClipLoader color="currentColor" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <AuthGuard />
      {isUserAuth && <Sidebar />}
      <div
        className={`flex min-h-screen flex-col items-center justify-center bg-white dark:bg-stone-800 ${
          isUserAuth &&
          `transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : 'ml-[54px]'}`
        }`}
      >
        <Routes>
          <Route index element={<Home />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path="login" element={<LogIn />} />
            <Route path="signup" element={<SignUp />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="chats/:chatId?" element={<Chat />} />
            <Route path="meetings" element={<Meetings />} />
            <Route
              path="meetings/:meetingId/transcription"
              element={<MeetingContent type="transcription" />}
            />
            <Route
              path="meetings/:meetingId/summary"
              element={<MeetingContent type="summary" />}
            />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
