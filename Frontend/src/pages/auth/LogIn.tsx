import { useTranslation } from 'react-i18next'

import AuthPageLayout from '../../components/auth/AuthPageLayout'
import LogInForm from '../../components/auth/forms/LogInForm'

export default function LogIn() {
  const { t } = useTranslation()

  return (
    <AuthPageLayout
      title={t('auth.login.title')}
      footerText={t('auth.login.footerText')}
      linkText={t('auth.login.linkText')}
      linkTo="/signup"
    >
      <LogInForm />
    </AuthPageLayout>
  )
}
