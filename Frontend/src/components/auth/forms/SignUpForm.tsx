import { useActionState } from 'react'

import FormButton from './utils/FormButton'
import FormErrors from './utils/FormErrors'
import Input from './utils/Input'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
    password: string
    confirmedPassword: string
  }
}

export default function SignUpForm() {
  const [formState, formAction] = useActionState<FormState, FormData>(
    signupAction,
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

      <Input
        label="password"
        id="password"
        name="password"
        type="password"
        defaultValue={formState.enteredValues?.password}
      />

      <Input
        label="confirm password"
        id="confirmedPassword"
        name="confirmedPassword"
        type="password"
        defaultValue={formState.enteredValues?.confirmedPassword}
      />

      <FormErrors errors={formState.errors} />

      <FormButton text="Sign up" />
    </form>
  )
}

async function signupAction(
  _prevFormState: FormState,
  formData: FormData,
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
      enteredValues: { email, password, confirmedPassword },
    }
  }

  return await processSignup(email, password, confirmedPassword)
}

interface SignupResponse {
  access_token: string
  token_type: string
}

async function processSignup(
  email: string,
  password: string,
  confirmedPassword: string,
): Promise<FormState> {
  try {
    const response = await sendSignupData(email, password)

    if (!response.ok) {
      return await handleSignupError(
        response,
        email,
        password,
        confirmedPassword,
      )
    }

    const data: SignupResponse = await response.json()
    const { access_token } = data
    localStorage.setItem('access_token', access_token)

    return {
      errors: null,
      enteredValues: { email, password, confirmedPassword },
    }
  } catch {
    return {
      errors: ['Network error or server unavailable'],
      enteredValues: { email, password, confirmedPassword },
    }
  }
}

async function sendSignupData(
  email: string,
  password: string,
): Promise<Response> {
  return await fetch('http://localhost:8000/auth/register', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: email,
      password: password,
    }),
  })
}

async function handleSignupError(
  response: Response,
  email: string,
  password: string,
  confirmedPassword: string,
): Promise<FormState> {
  if (response.status !== 400) {
    const errorData = await response.text()
    return {
      errors: [`Signup failed: ${errorData || response.statusText}`],
      enteredValues: { email, password, confirmedPassword },
    }
  }

  try {
    const errorData = await response.json()
    return {
      errors: [errorData.detail || 'Could not sign up'],
      enteredValues: { email, password, confirmedPassword },
    }
  } catch {
    return {
      errors: ['Could not sign up'],
      enteredValues: { email, password, confirmedPassword },
    }
  }
}
