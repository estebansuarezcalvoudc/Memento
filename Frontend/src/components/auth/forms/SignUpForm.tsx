import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()
  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prevState, formData) =>
      signupAction(prevState, formData, navigate, setIsUserAuth, register, t),
    {
      errors: null,
    },
  )

  return (
    <form action={formAction}>
      <Input
        label={t('auth.fields.email')}
        name="email"
        type="email"
        defaultValue={formState.enteredValues?.email}
      />

      <Input
        label={t('auth.fields.password')}
        name="password"
        type="password"
      />

      <Input
        label={t('auth.fields.confirmPassword')}
        name="confirmedPassword"
        type="password"
      />

      <FormErrors errors={formState.errors} />

      <FormButton
        isPending={isPending}
        classes="mt-7 w-full"
        text={t('auth.signup.signUp')}
      />
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
  ) => Promise<{ accessToken: string; token_type: string }>,
  t: (key: string) => string,
): Promise<FormState> {
  const email = (formData.get('email') ?? '') as string
  const password = (formData.get('password') ?? '') as string
  const confirmedPassword = (formData.get('confirmedPassword') ?? '') as string

  const errors = []

  if (email.trim() === '') {
    errors.push(t('auth.errors.emailRequired'))
  }

  if (password.trim() === '') {
    errors.push(t('auth.errors.passwordRequired'))
  }

  if (confirmedPassword.trim() === '') {
    errors.push(t('auth.errors.confirmPasswordRequired'))
  }

  if (password !== confirmedPassword) {
    errors.push(t('auth.errors.passwordsMismatch'))
  }

  if (errors.length > 0) {
    return {
      errors,
      enteredValues: { email },
    }
  }

  return await processSignup(
    email,
    password,
    navigate,
    setIsUserAuth,
    register,
    t,
  )
}

async function processSignup(
  email: string,
  password: string,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
  register: (
    email: string,
    password: string,
  ) => Promise<{ accessToken: string; token_type: string }>,
  t: (key: string) => string,
): Promise<FormState> {
  try {
    const data = await register(email, password)
    const { accessToken } = data
    localStorage.setItem('access_token', accessToken)
    setIsUserAuth(true)

    navigate('/')

    return {
      errors: null,
      enteredValues: { email },
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : t('auth.errors.signUpFailed')
    return {
      errors: [errorMessage],
      enteredValues: { email },
    }
  }
}
