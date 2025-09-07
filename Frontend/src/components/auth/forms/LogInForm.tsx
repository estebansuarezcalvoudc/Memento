import { useActionState } from 'react'

import FormButton from './utils/FormButton'
import Input from './utils/Input'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
    password: string
  }
}

export default function LogInForm() {
  const [formState, formAction] = useActionState<FormState, FormData>(
    loginAction,
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

      {formState.errors && (
        <ul className="font-ubuntu mt-8 rounded-xl border-red-700 bg-red-200 px-3 py-1 text-sm text-red-700">
          {formState.errors.map(error => (
            <li key={error}>{`${error}`}</li>
          ))}
        </ul>
      )}

      <FormButton text="Sign in" />
    </form>
  )
}

async function loginAction(
  _prevFormState: FormState,
  formData: FormData,
): Promise<FormState> {
  const email = (formData.get('email') ?? '') as string
  const password = (formData.get('password') ?? '') as string

  const errors = []

  if (email.trim() === '') {
    errors.push('You must provide your email')
  }

  if (password.trim() === '') {
    errors.push('You must provide your password')
  }

  if (errors.length > 0) {
    return {
      errors,
      enteredValues: { email, password },
    }
  }

  return await processLogin(email, password)
}

interface LoginResponse {
  access_token: string
  token_type: string
}

async function processLogin(
  email: string,
  password: string,
): Promise<FormState> {
  try {
    const response = await sendLoginData(email, password)

    if (!response.ok) {
      return await handleLoginError(response, email, password)
    }

    const data: LoginResponse = await response.json()
    const { access_token } = data
    localStorage.setItem('access_token', access_token)

    return {
      errors: null,
      enteredValues: { email, password },
    }
  } catch {
    return {
      errors: ['Network error or server unavailable'],
      enteredValues: { email, password },
    }
  }
}

async function sendLoginData(
  email: string,
  password: string,
): Promise<Response> {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)

  return await fetch('http://localhost:8000/auth/token', {
    method: 'POST',
    body: formData,
  })
}

async function handleLoginError(
  response: Response,
  email: string,
  password: string,
): Promise<FormState> {
  if (response.status !== 401) {
    const errorData = await response.text()
    return {
      errors: [`Login failed: ${errorData || response.statusText}`],
      enteredValues: { email, password },
    }
  }

  try {
    const errorData = await response.json()
    return {
      errors: [errorData.detail || 'Invalid credentials'],
      enteredValues: { email, password },
    }
  } catch {
    return {
      errors: ['Invalid credentials'],
      enteredValues: { email, password },
    }
  }
}
