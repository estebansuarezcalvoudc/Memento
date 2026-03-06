import { useMutation } from '@tanstack/react-query'

import {
  deleteAccount,
  updatePassword,
  updateUsername,
  type Token,
} from '../../authAPI'

export function useUpdateUsername() {
  return useMutation<Token, Error, { newUsername: string; password: string }>({
    mutationFn: ({ newUsername, password }) =>
      updateUsername(newUsername, password),
  })
}

export function useUpdatePassword() {
  return useMutation<
    null,
    Error,
    { currentPassword: string; newPassword: string }
  >({
    mutationFn: ({ currentPassword, newPassword }) =>
      updatePassword(currentPassword, newPassword),
  })
}

export function useDeleteAccount() {
  return useMutation<null, Error, { password: string }>({
    mutationFn: ({ password }) => deleteAccount(password),
  })
}
