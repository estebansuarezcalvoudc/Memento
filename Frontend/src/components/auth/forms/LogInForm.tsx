import { useActionState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, type NavigateFunction } from 'react-router-dom'

import { login } from '../../../api/authAPI'
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

export default function LogInForm() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const setIsUserAuth = useSetIsUserAuth()
  const [formState, formAction, isPending] = useActionState<
    FormState,
    FormData
  >(
    (prevState, formData) =>
      loginAction(prevState, formData, navigate, setIsUserAuth, login, t),
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

      <FormErrors errors={formState.errors} />

      <FormButton
        isPending={isPending}
        classes="mt-7 w-full"
        text={t('auth.login.signIn')}
      />
    </form>
  )
}

async function loginAction(
  _prevFormState: FormState,
  formData: FormData,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
  login: (
    email: string,
    password: string,
  ) => Promise<{ accessToken: string; token_type: string }>,
  t: (key: string) => string,
): Promise<FormState> {
  const email = (formData.get('email') ?? '') as string
  const password = (formData.get('password') ?? '') as string

  const errors = []

  if (email.trim() === '') {
    errors.push(t('auth.errors.emailRequired'))
  }

  if (password.trim() === '') {
    errors.push(t('auth.errors.passwordRequired'))
  }

  if (errors.length > 0) {
    return {
      errors,
      enteredValues: { email },
    }
  }

  return await processLogin(email, password, navigate, setIsUserAuth, login, t)
}

async function processLogin(
  email: string,
  password: string,
  navigate: NavigateFunction,
  setIsUserAuth: SetIsUserAuth,
  login: (
    email: string,
    password: string,
  ) => Promise<{ accessToken: string; token_type: string }>,
  t: (key: string) => string,
): Promise<FormState> {
  try {
    const data = await login(email, password)
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
      error instanceof Error
        ? error.message
        : t('auth.errors.invalidCredentials')
    return {
      errors: [errorMessage],
      enteredValues: { email },
    }
  }
}
