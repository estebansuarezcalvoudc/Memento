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

function loginAction(_prevFormState: FormState, formData: FormData): FormState {
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

  return {
    errors: null,
    enteredValues: { email, password },
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
