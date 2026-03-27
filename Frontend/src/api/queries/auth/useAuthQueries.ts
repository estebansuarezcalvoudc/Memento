import { useMutation, useQuery } from '@tanstack/react-query'

import {
  deleteAccount,
  getAccountDeletionPolicy,
  updatePassword,
  updateUsername,
  type AccountDeletionPolicy,
  type Token,
} from '../../authAPI'

const ACCOUNT_DELETION_POLICY_KEY = ['auth', 'account-deletion-policy']

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

export function useGetAccountDeletionPolicy() {
  return useQuery<AccountDeletionPolicy, Error>({
    queryKey: ACCOUNT_DELETION_POLICY_KEY,
    queryFn: () => getAccountDeletionPolicy(),
  })
}
