import { http, HttpResponse } from 'msw'

import { withAuth } from '../withAuth'

export const chatHandlers = [
  http.get(
    '/api/settings/models/chat',
    withAuth(() =>
      HttpResponse.json({
        provider: 'Ollama',
        model_name: 'llama3.2:latest',
        temperature: 0.7,
        max_tokens: 2000,
      }),
    ),
  ),
  http.put(
    '/api/settings/models/chat',
    withAuth(async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(body)
    }),
  ),
  http.get(
    '/api/settings/models/retrieval',
    withAuth(() =>
      HttpResponse.json({
        provider: 'OpenAI',
        model_name: 'gpt-4o',
        temperature: 0.5,
        max_tokens: 4000,
      }),
    ),
  ),
  http.put(
    '/api/settings/models/retrieval',
    withAuth(async ({ request }) => {
      const body = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(body)
    }),
  ),
]
