import FormButton from './FormButton'
import Input from './Input'

export default function LogInForm() {
  return (
    <form>
      <Input label="email" id="email" type="email" />
      <Input label="password" id="password" type="password" />
      <FormButton text='Sign in' />
    </form>
  )
}
