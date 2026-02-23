import { http, HttpResponse } from 'msw'

import { withAuth } from '../withAuth'

export const mockProviders = [
  { name: 'ollama', requires_api_key: false, has_api_key: null, active: true },
  { name: 'openai', requires_api_key: true, has_api_key: true, active: false },
]

export const providerHandlers = [
  http.get('/api/settings/providers', withAuth(() =>
    HttpResponse.json(mockProviders),
  )),
  http.post('/api/settings/providers/:name/api-key', withAuth(() =>
    new HttpResponse(null, { status: 200 }),
  )),
  http.delete('/api/settings/providers/:name/api-key', withAuth(() =>
    new HttpResponse(null, { status: 204 }),
  )),
  http.put('/api/settings/providers/:name/status', withAuth(() =>
    new HttpResponse(null, { status: 200 }),
  )),
]
