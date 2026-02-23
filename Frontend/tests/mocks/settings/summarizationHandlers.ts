import { http, HttpResponse } from 'msw'

import { withAuth } from '../withAuth'

export const summarizationHandlers = [
  http.get('/api/settings/templates/prompt', withAuth(() =>
    HttpResponse.json({ system_prompt: 'You are a helpful assistant. Summarize the meeting.' }),
  )),
  http.get('/api/settings/templates/default-prompt', withAuth(() =>
    HttpResponse.json({ system_prompt: 'Default system prompt text here.' }),
  )),
  http.put('/api/settings/templates/prompt', withAuth(async ({ request }) => {
    const body = await request.json() as { system_prompt: string }
    return HttpResponse.json({ system_prompt: body.system_prompt })
  })),
  http.get('/api/settings/models/available', withAuth(() =>
    HttpResponse.json([
      { id: 'gpt-4o', provider: 'openai' },
      { id: 'llama3', provider: 'ollama' },
    ]),
  )),
  http.get('/api/settings/models/summary', withAuth(() =>
    HttpResponse.json({ provider: 'openai', model_name: 'gpt-4o', temperature: 0.7, max_tokens: 2000 }),
  )),
  http.put('/api/settings/models/summary', withAuth(async ({ request }) => {
    const body = await request.json() as Record<string, unknown>
    return HttpResponse.json(body)
  })),
]
