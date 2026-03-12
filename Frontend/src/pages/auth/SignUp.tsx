import { useTranslation } from 'react-i18next'

import AuthPageLayout from '../../components/auth/AuthPageLayout'
import SignUpForm from '../../components/auth/forms/SignUpForm'

export default function SignUp() {
  const { t } = useTranslation()

  return (
    <AuthPageLayout
      title={t('auth.signup.title')}
      footerText={t('auth.signup.footerText')}
      linkText={t('auth.signup.linkText')}
      linkTo="/login"
    >
      <SignUpForm />
    </AuthPageLayout>
  )
}
