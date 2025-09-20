import { useActionState } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { useSetIsUserAuth, type SetIsUserAuth } from '../../../stores/authStore'
import FormButton from './utils/FormButton'
import FormErrors from './utils/FormErrors'
import Input from './utils/Input'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
  }
}

export default function LogInForm() {
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()
  const [formState, formAction] = useActionState<FormState, FormData>(
    (prevState, formData) =>
      loginAction(prevState, formData, navigate, setIsUserAuth),
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

      <FormErrors errors={formState.errors} />

      <FormButton text="Sign in" />
    </form>
  )
}

async function loginAction(
  _prevFormState: FormState,
  formData: FormData,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
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
      enteredValues: { email },
    }
  }

  return await processLogin(email, password, navigate, setIsUserAuth)
}

interface LoginResponse {
  access_token: string
  token_type: string
}

async function processLogin(
  email: string,
  password: string,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
): Promise<FormState> {
  try {
    const response = await sendLoginData(email, password)

    if (!response.ok) {
      return await handleLoginError(response, email)
    }

    const data: LoginResponse = await response.json()
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

async function sendLoginData(
  email: string,
  password: string,
): Promise<Response> {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)

  return await fetch('/api/auth/token', {
    method: 'POST',
    body: formData,
  })
}

async function handleLoginError(
  response: Response,
  email: string,
): Promise<FormState> {
  if (response.status !== 401) {
    const errorData = await response.text()
    return {
      errors: [`Login failed: ${errorData || response.statusText}`],
      enteredValues: { email },
    }
  }

  try {
    const errorData = await response.json()
    return {
      errors: [errorData.detail || 'Invalid credentials'],
      enteredValues: { email },
    }
  } catch {
    return {
      errors: ['Invalid credentials'],
      enteredValues: { email },
    }
  }
}
