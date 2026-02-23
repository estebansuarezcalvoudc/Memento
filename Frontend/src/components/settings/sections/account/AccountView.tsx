import { useState } from 'react'

import UpdateEmailForm from './UpdateEmailForm'
import UpdatePasswordForm from './UpdatePasswordForm'

type ActiveForm = 'email' | 'password' | null

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
      <div className="mt-4 flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <span className="font-ubuntu text-sm text-stone-700">
            Email: {username}
          </span>
          {activeForm === null && (
            <>
              <button
                onClick={() => setActiveForm('email')}
                className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-sm text-stone-500 underline hover:text-stone-800"
              >
                Edit email
              </button>
              <button
                onClick={() => setActiveForm('password')}
                className="font-ubuntu cursor-pointer rounded-lg px-2 py-1 text-sm text-stone-500 underline hover:text-stone-800"
              >
                Change password
              </button>
            </>
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
      </div>
    </>
  )
}
