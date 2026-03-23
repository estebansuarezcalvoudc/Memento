import { http, HttpResponse } from 'msw'

import { withAuth } from '../withAuth'

let activeProvider: 'whisperx' | 'aai' = 'whisperx'
let hasAaiApiKey = false

export function resetTranscriptionMockState() {
  activeProvider = 'whisperx'
  hasAaiApiKey = false
}

const whisperxOptions = {
  models: ['tiny', 'base', 'small', 'medium', 'large-v3'],
  compute_types: ['float16', 'int8'],
  devices: ['cuda', 'cpu'],
}

const aaiOptions = {
  speech_models: ['nano', 'universal'],
  supports_language_detection: true,
}

const whisperxConfiguration = {
  model_size: 'base',
  compute_type: 'float16',
  device: 'cuda',
}

const aaiConfiguration = {
  speech_model: 'universal',
  speaker_labels: true,
}

export const transcriptionHandlers = [
  // Language list (used in MeetingForm)
  http.get(
    '/api/settings/transcription/languages',
    withAuth(() =>
      HttpResponse.json([
        { code: 'en', name: 'English' },
        { code: 'es', name: 'Spanish' },
      ]),
    ),
  ),
  http.get(
    '/api/settings/transcription/available-options',
    withAuth(() =>
      HttpResponse.json(
        activeProvider === 'whisperx' ? whisperxOptions : aaiOptions,
      ),
    ),
  ),
  http.get(
    '/api/settings/transcription/configuration',
    withAuth(() =>
      HttpResponse.json(
        activeProvider === 'whisperx'
          ? whisperxConfiguration
          : aaiConfiguration,
      ),
    ),
  ),
  http.get(
    '/api/settings/transcription/providers',
    withAuth(() =>
      HttpResponse.json([
        {
          name: 'whisperx',
          requires_api_key: false,
          has_api_key: null,
          is_active: activeProvider === 'whisperx',
        },
        {
          name: 'aai',
          requires_api_key: true,
          has_api_key: hasAaiApiKey,
          is_active: activeProvider === 'aai',
        },
      ]),
    ),
  ),
  http.patch(
    '/api/settings/transcription/active-provider',
    withAuth(async ({ request }) => {
      const body = (await request.json()) as { provider: 'whisperx' | 'aai' }
      if (body.provider === 'aai' && !hasAaiApiKey) {
        return HttpResponse.json(
          { detail: 'Provider aai requires API key configuration' },
          { status: 400 },
        )
      }
      activeProvider = body.provider
      return new HttpResponse(null, { status: 204 })
    }),
  ),
  http.post(
    '/api/settings/transcription/providers/:name/api-key',
    withAuth(async ({ params, request }) => {
      const provider = params.name as string
      const body = (await request.json()) as { api_key: string }

      if (provider !== 'aai') {
        return HttpResponse.json(
          { detail: `Provider ${provider} does not require an API key` },
          { status: 400 },
        )
      }
      if (!body.api_key || body.api_key.startsWith('bad')) {
        return HttpResponse.json(
          { detail: 'Invalid API key for aai' },
          { status: 401 },
        )
      }

      hasAaiApiKey = true
      return new HttpResponse(null, { status: 204 })
    }),
  ),
  http.delete(
    '/api/settings/transcription/providers/:name/api-key',
    withAuth(({ params }) => {
      const provider = params.name as string
      if (provider === 'aai') {
        hasAaiApiKey = false
        if (activeProvider === 'aai') {
          activeProvider = 'whisperx'
        }
      }
      return new HttpResponse(null, { status: 204 })
    }),
  ),
  http.patch(
    '/api/settings/transcription/configuration',
    withAuth(async ({ request }) => {
      const body = (await request.json()) as Record<string, string | boolean>
      if (activeProvider === 'whisperx') {
        return HttpResponse.json({
          ...whisperxConfiguration,
          ...body,
        })
      }
      return HttpResponse.json({
        ...aaiConfiguration,
        ...body,
      })
    }),
  ),
]
