import { Link } from 'react-router-dom'

import SignUpForm from '../components/auth/forms/SignUpForm'

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center align-middle">
      <div className="rounded-xl border-1 border-stone-500 p-8">
        <h2 className="font-dongle text-center text-4xl text-stone-700">
          Sign up to TFG
        </h2>
        <SignUpForm />
        <span className="font-ubuntu mt-5 block text-center text-sm text-stone-800">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-700 underline">
            Log in
          </Link>
        </span>
      </div>
    </div>
  )
}
