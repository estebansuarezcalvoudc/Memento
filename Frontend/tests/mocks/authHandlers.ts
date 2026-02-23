import { http, HttpResponse } from 'msw'

export const authHandlers = [
  http.post('/api/auth/token', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),
  http.post('/api/auth/register', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),
]
