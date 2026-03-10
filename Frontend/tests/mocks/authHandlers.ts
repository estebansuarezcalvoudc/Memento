import { http, HttpResponse } from 'msw'

import { withAuth } from './withAuth'

export const NEW_AUTH_TOKEN = `h.${btoa(JSON.stringify({ sub: 'new@example.com' }))}.s`

export const authHandlers = [
  http.post('/api/auth/token', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),
  http.post('/api/auth/register', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),
  http.patch(
    '/api/auth/username',
    withAuth(() =>
      HttpResponse.json({ access_token: NEW_AUTH_TOKEN, token_type: 'bearer' }),
    ),
  ),
  http.patch(
    '/api/auth/password',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
  http.delete(
    '/api/auth',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
]
