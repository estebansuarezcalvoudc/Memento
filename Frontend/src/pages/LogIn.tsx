import { Link } from 'react-router-dom'

import LogInForm from '../components/auth/forms/LogInForm'

export default function LogIn() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center align-middle">
      <div className="rounded-xl border-1 border-stone-500 p-8">
        <h2 className="font-dongle text-center text-4xl text-stone-700">
          Sign in to TFG
        </h2>
        <LogInForm />
        <span className="block font-ubuntu text-center text-sm mt-5 text-stone-800">
          New to TFG? <Link to="/signup" className='text-blue-700 underline'>Create an account</Link>
        </span>
      </div>
    </div>
  )
}
