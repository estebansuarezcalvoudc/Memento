import fetchBackend from './utils/fetchBackend'

export interface Token {
  accessToken: string
  token_type: string
}

export async function login(email: string, password: string): Promise<Token> {
  const formData = new FormData()
  formData.append('username', email)
  formData.append('password', password)
  return fetchBackend('POST', 'auth/token', formData)
}

export async function register(
  email: string,
  password: string,
): Promise<Token> {
  return fetchBackend('POST', 'auth/register', {
    username: email,
    password,
  })
}

export async function updateUsername(
  newUsername: string,
  password: string,
): Promise<Token> {
  return fetchBackend('PATCH', 'auth/username', {
    new_username: newUsername,
    password,
  })
}

export async function updatePassword(
  currentPassword: string,
  newPassword: string,
): Promise<null> {
  return fetchBackend('PATCH', 'auth/password', {
    current_password: currentPassword,
    new_password: newPassword,
  })
}

export async function deleteAccount(password: string): Promise<null> {
  return fetchBackend('DELETE', 'auth', {
    password,
  })
}
