import { useTranslation } from 'react-i18next'

import AuthLink from '../components/auth/AuthLink'
import { useIsUserAuth } from '../stores/authStore'

export default function Home() {
  const { t } = useTranslation()
  const isUserAuth = useIsUserAuth()

  return (
    <>
      <h1 className="font-dongle text-center text-8xl text-stone-800 dark:text-stone-100">
        {t('home.welcome')}
      </h1>
      <span className="font-ubuntu text-lg text-stone-700 dark:text-stone-300">
        {t('home.subtitle')}
      </span>
      {!isUserAuth && (
        <div className="mt-8 flex justify-center space-x-5">
          <AuthLink
            to="/login"
            text={t('home.logIn')}
            hoverColor="hover:bg-blue-500"
            bgColor="bg-blue-400"
          />
          <AuthLink
            to="/signup"
            text={t('home.signUp')}
            hoverColor="hover:bg-stone-300 dark:hover:bg-stone-600"
            bgColor="bg-white dark:bg-stone-800"
            border="border-1 border-stone-400 dark:border-stone-600"
          />
        </div>
      )}
    </>
  )
}
