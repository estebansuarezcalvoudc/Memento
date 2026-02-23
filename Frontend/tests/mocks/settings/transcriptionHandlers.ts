import { http, HttpResponse } from 'msw'

import { withAuth } from '../withAuth'

export const transcriptionHandlers = [
  // Language list (used in MeetingForm)
  http.get('/api/settings/transcription/languages', withAuth(() =>
    HttpResponse.json([
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
    ]),
  )),
  http.get('/api/settings/transcription/available-options', withAuth(() =>
    HttpResponse.json({
      models: ['tiny', 'base', 'small', 'medium', 'large-v3'],
      compute_types: ['float16', 'int8'],
      devices: ['cuda', 'cpu'],
    }),
  )),
  http.get('/api/settings/transcription/configuration', withAuth(() =>
    HttpResponse.json({ model_size: 'base', compute_type: 'float16', device: 'cuda' }),
  )),
  http.patch('/api/settings/transcription/configuration', withAuth(async ({ request }) => {
    const body = await request.json() as Record<string, string>
    return HttpResponse.json({ model_size: 'base', compute_type: 'float16', device: 'cuda', ...body })
  })),
]
