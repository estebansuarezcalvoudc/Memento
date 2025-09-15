import { BrowserRouter, Route, Routes } from 'react-router-dom'

import Sidebar from './components/side-bar/Sidebar'
import Chat from './pages/Chat'
import Home from './pages/Home'
import LogIn from './pages/LogIn'
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
        className={`flex min-h-screen flex-col items-center justify-center align-middle transition-all duration-300 ease-in-out ${isUserAuth ? (isSidebarOpen ? 'ml-64' : 'ml-16') : 'ml-0'
          }`}
      >
        <Routes>
          <Route index element={<Home />} />
          <Route path="login" element={<LogIn />} />
          <Route path="signup" element={<SignUp />} />
          <Route path="chats/:chatId" element={<Chat />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
