import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

import { clearAuthSession } from '../../../../auth/session'
import { useSetIsUserAuth } from '../../../../stores/authStore'
import InlineButton from '../../../ui/buttons/InlineButton'
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
    return payload.email ?? ''
  } catch {
    return ''
  }
}

export default function AccountView() {
  const { t } = useTranslation()
  const [activeForm, setActiveForm] = useState<ActiveForm>(null)
  const [username, setUsername] = useState(() => getUsernameFromToken())
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()

  return (
    <>
      <div>
        <div className="flex flex-wrap justify-between gap-y-2">
          <span className="font-ubuntu text-lg text-stone-700 dark:text-stone-300">
            <strong>{t('settings.account.email')}:</strong> {username}
          </span>
          {activeForm === null && (
            <div className="flex flex-wrap gap-2">
              <InlineButton onClick={() => setActiveForm('email')}>
                {t('settings.account.editEmail')}
              </InlineButton>
              <InlineButton onClick={() => setActiveForm('password')}>
                {t('settings.account.changePassword')}
              </InlineButton>
              <InlineButton
                variant="emphasis"
                onClick={() => {
                  clearAuthSession()
                  setIsUserAuth(false)
                  navigate('/login')
                }}
              >
                {t('settings.account.logOut')}
              </InlineButton>
              <InlineButton
                variant="danger"
                onClick={() => setActiveForm('delete account')}
              >
                {t('settings.account.deleteAccount')}
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
