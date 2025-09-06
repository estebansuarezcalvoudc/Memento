import { useActionState } from 'react'

import FormButton from './FormButton'
import Input from './Input'

interface FormState {
  errors: null | string[]
  enteredValues?: {
    email: string
    password: string
    confirmedPassword: string
  }
}

function signupAction(
  _prevFormState: FormState,
  formData: FormData,
): FormState {
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

  return {
    errors: null,
    enteredValues: { email, password, confirmedPassword },
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

      {formState.errors && (
        <ul className="font-ubuntu mt-8 rounded-xl border-red-700 bg-red-200 px-3 py-1 text-sm text-red-700">
          {formState.errors.map(error => (
            <li key={error}>{`${error}`}</li>
          ))}
        </ul>
      )}

      <FormButton text="Sign up" />
    </form>
  )
}
