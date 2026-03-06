import { useState } from 'react'

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

  return (
    <>
      <div className="flex-col">
        <div className="flex justify-between">
          <span className="font-ubuntu text-lg text-stone-700">
            <strong>Email:</strong> {username}
          </span>
          {activeForm === null && (
            <div className="gap-x-8">
              <button
                onClick={() => setActiveForm('email')}
                className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-stone-500 underline hover:text-stone-800"
              >
                Edit email
              </button>
              <button
                onClick={() => setActiveForm('password')}
                className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-stone-500 underline hover:text-stone-800"
              >
                Change password
              </button>
              <button
                onClick={() => setActiveForm('delete account')}
                className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-base text-red-500 underline hover:text-red-800"
              >
                Delete account
              </button>
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
