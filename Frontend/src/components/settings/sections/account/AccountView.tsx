import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useSetIsUserAuth } from '../../../../stores/authStore'
import InlineButton from '../ui/InlineButton'
import DeleteAccountForm from './DeleteAccountForm'
import UpdateEmailForm from './UpdateEmailForm'
import UpdatePasswordForm from './UpdatePasswordForm'

type ActiveForm = 'email' | 'password' | 'delete account' | null

function getUsernameFromToken(): string {
  const token = localStorage.getItem('access_token')
  if (!token) {
    return ''
  }
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.sub ?? ''
  } catch {
    return ''
  }
}

export default function AccountView() {
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [username, setUsername] = useState(() => getUsernameFromToken())
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()

  return (
    <>
      <div>
        <div className="flex justify-between">
          <span className="font-ubuntu text-lg text-stone-700">
            <strong>Email:</strong> {username}
          </span>
          {activeForm === null && (
            <div className="flex gap-x-2">
              <InlineButton onClick={() => setActiveForm('email')}>
                Edit email
              </InlineButton>
              <InlineButton onClick={() => setActiveForm('password')}>
                Change password
              </InlineButton>
              <InlineButton
                variant="emphasis"
                onClick={() => {
                  localStorage.removeItem('access_token')
                  setIsUserAuth(false)
                  navigate('/login')
                }}
              >
                Log out
              </InlineButton>
              <InlineButton
                variant="danger"
                onClick={() => setActiveForm('delete account')}
              >
                Delete account
              </InlineButton>
            </div>
          )}
        </div>

        {activeForm === 'email' && (
          <UpdateEmailForm
            onClose={() => setActiveForm(null)}
            onSuccess={newUsername => {
              setUsername(newUsername)
              setActiveForm(null)
            }}
          />
        )}

        {activeForm === 'password' && (
          <UpdatePasswordForm onClose={() => setActiveForm(null)} />
        )}

        {activeForm === 'delete account' && (
          <DeleteAccountForm onClose={() => setActiveForm(null)} />
        )}
      </div>
    </>
  )
}
