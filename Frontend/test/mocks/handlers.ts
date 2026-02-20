import { http, HttpResponse } from 'msw'

export const mockChats = [
  { id: 'chat-1', title: 'First Chat', started_at: '2024-01-01T00:00:00Z' },
  { id: 'chat-2', title: 'Second Chat', started_at: '2024-01-02T00:00:00Z' },
]

export const mockMeetings = [
  { id: 'meeting-1', title: 'Team Meeting', date: '2024-01-15' },
  { id: 'meeting-2', title: 'Sprint Planning', date: '2024-01-22' },
]

export const handlers = [
  // Auth
  http.post('/api/auth/token', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),
  http.post('/api/auth/register', () =>
    HttpResponse.json({ access_token: 'fake-token', token_type: 'bearer' }),
  ),

  // Conversations
  http.get('/api/conversations', () => HttpResponse.json(mockChats)),
  http.post('/api/conversations', () =>
    HttpResponse.json({
      id: 'new-chat-1',
      title: 'New Chat',
      started_at: '2024-01-03T00:00:00Z',
    }),
  ),
  http.get('/api/conversations/:id', () =>
    HttpResponse.json([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]),
  ),
  http.put(
    '/api/conversations/:id',
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.delete(
    '/api/conversations/:id',
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.post('/api/conversations/:id/chat', () =>
    HttpResponse.json('Assistant response here'),
  ),

  // Meetings
  http.get('/api/meetings', () => HttpResponse.json(mockMeetings)),
  http.post('/api/meetings', () =>
    HttpResponse.json([
      { id: 'new-meeting-1', title: 'New Meeting', date: '2024-02-01' },
    ]),
  ),
  http.get('/api/meetings/summary/:id', () =>
    HttpResponse.json({
      summary: '## Summary\nContent here',
      title: 'Team Meeting',
      date: '2024-01-15',
    }),
  ),
  http.get('/api/meetings/transcription/:id', () =>
    HttpResponse.json({
      transcription: 'Speaker 1: Hello everyone',
      title: 'Team Meeting',
      date: '2024-01-15',
    }),
  ),
  http.patch(
    '/api/meetings/:id',
    () => new HttpResponse(null, { status: 204 }),
  ),
  http.delete(
    '/api/meetings/:id',
    () => new HttpResponse(null, { status: 204 }),
  ),

  // WhisperX
  http.get('/api/settings/transcription/whisperx/languages', () =>
    HttpResponse.json([
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
    ]),
  ),
]
