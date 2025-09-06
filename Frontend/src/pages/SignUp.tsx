import AuthPageLayout from '../components/auth/AuthPageLayout'
import SignUpForm from '../components/auth/forms/SignUpForm'

export default function SignUp() {
  return (
    <AuthPageLayout
      title="Sign up to TFG"
      footerText="Already have an account?"
      linkText="Log in"
      linkTo="/login"
    >
      <SignUpForm />
    </AuthPageLayout>
  )
}
