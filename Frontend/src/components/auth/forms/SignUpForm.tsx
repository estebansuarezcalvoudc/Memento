import { useActionState } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { useSetIsUserAuth, type SetIsUserAuth } from '../../../stores/authStore'
import Input from '../../common/Input'
import FormButton from './utils/FormButton'
import FormErrors from './utils/FormErrors'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
  }
}

export default function SignUpForm() {
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()
  const [formState, formAction] = useActionState<FormState, FormData>(
    (prevState, formData) =>
      signupAction(prevState, formData, navigate, setIsUserAuth),
    {
      errors: null,
    },
  )

  return (
    <form action={formAction}>
      <Input
        label="email"
        id="email"
        name="email"
        type="email"
        defaultValue={formState.enteredValues?.email}
      />

      <Input label="password" id="password" name="password" type="password" />

      <Input
        label="confirm password"
        id="confirmedPassword"
        name="confirmedPassword"
        type="password"
      />

      <FormErrors errors={formState.errors} />

      <FormButton text="Sign up" />
    </form>
  )
}

async function signupAction(
  _prevFormState: FormState,
  formData: FormData,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
): Promise<FormState> {
  const email = (formData.get('email') ?? '') as string
  const password = (formData.get('password') ?? '') as string
  const confirmedPassword = (formData.get('confirmedPassword') ?? '') as string

  const errors = []

  if (email.trim() === '') {
    errors.push('You must provide your email')
  }

  if (password.trim() === '') {
    errors.push('You must provide your password')
  }

  if (confirmedPassword.trim() === '') {
    errors.push('You must confirm your password')
  }

  if (password !== confirmedPassword) {
    errors.push('Provided passwords do not match')
  }

  if (errors.length > 0) {
    return {
      errors,
      enteredValues: { email },
    }
  }

  return await processSignup(email, password, navigate, setIsUserAuth)
}

interface SignupResponse {
  access_token: string
  token_type: string
}

async function processSignup(
  email: string,
  password: string,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
): Promise<FormState> {
  try {
    const response = await sendSignupData(email, password)

    if (!response.ok) {
      return await handleSignupError(response, email)
    }

    const data: SignupResponse = await response.json()
    const { access_token } = data
    localStorage.setItem('access_token', access_token)
    setIsUserAuth(true)

    navigate('/')

    return {
      errors: null,
      enteredValues: { email },
    }
  } catch {
    return {
      errors: ['Network error or server unavailable'],
      enteredValues: { email },
    }
  }
}

async function sendSignupData(
  email: string,
  password: string,
): Promise<Response> {
  return await fetch('/api/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password,
    }),
  })
}

async function handleSignupError(
  response: Response,
  email: string,
): Promise<FormState> {
  if (response.status !== 400) {
    const errorData = await response.text()
    return {
      errors: [`Signup failed: ${errorData || response.statusText}`],
      enteredValues: { email },
    }
  }

  try {
    const errorData = await response.json()
    return {
      errors: [errorData.detail || 'Could not sign up'],
      enteredValues: { email },
    }
  } catch {
    return {
      errors: ['Could not sign up'],
      enteredValues: { email },
    }
  }
}
