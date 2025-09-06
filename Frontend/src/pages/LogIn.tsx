import AuthPageLayout from '../components/auth/AuthPageLayout'
import LogInForm from '../components/auth/forms/LogInForm'

export default function LogIn() {
  return (
    <AuthPageLayout
      title="Sign in to TFG"
      footerText="New to TFG?"
      linkText="Create an account"
      linkTo="/signup"
    >
      <LogInForm />
    </AuthPageLayout>
  )
}
