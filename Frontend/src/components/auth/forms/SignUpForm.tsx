import { useActionState } from 'react'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { register } from '../../../api/authAPI'
import { useSetIsUserAuth, type SetIsUserAuth } from '../../../stores/authStore'
import FormButton from '../../common/FormButton'
import FormErrors from '../../common/FormErrors'
import Input from '../../common/Input'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
  }
}

export default function SignUpForm() {
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()
  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prevState, formData) =>
      signupAction(prevState, formData, navigate, setIsUserAuth, register),
    {
      errors: null,
    },
  )

  return (
    <form action={formAction}>
      <Input
        label="email"
        name="email"
        type="email"
        defaultValue={formState.enteredValues?.email}
      />

      <Input label="password" name="password" type="password" />

      <Input
        label="confirm password"
        name="confirmedPassword"
        type="password"
      />

      <FormErrors errors={formState.errors} />

      <FormButton isPending={isPending} classes="mt-7 w-full" text="Sign up" />
    </form>
  )
}

async function signupAction(
  _prevFormState: FormState,
  formData: FormData,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
  register: (
    email: string,
    password: string,
  ) => Promise<{ access_token: string; token_type: string }>,
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

  return await processSignup(email, password, navigate, setIsUserAuth, register)
}

async function processSignup(
  email: string,
  password: string,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
  register: (
    email: string,
    password: string,
  ) => Promise<{ access_token: string; token_type: string }>,
): Promise<FormState> {
  try {
    const data = await register(email, password)
    const { access_token } = data
    localStorage.setItem('access_token', access_token)
    setIsUserAuth(true)

    navigate('/')

    return {
      errors: null,
      enteredValues: { email },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Could not sign up'
    return {
      errors: [errorMessage],
      enteredValues: { email },
    }
  }
}
