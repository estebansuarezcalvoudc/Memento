import { http, HttpResponse } from 'msw'

import { withAuth } from './withAuth'

export const mockChats = [
  { id: 'chat-1', title: 'First Chat', started_at: '2024-01-01T00:00:00Z' },
  { id: 'chat-2', title: 'Second Chat', started_at: '2024-01-02T00:00:00Z' },
]

export const conversationHandlers = [
  http.get('/api/conversations', withAuth(() => HttpResponse.json(mockChats))),
  http.post('/api/conversations', withAuth(() =>
    HttpResponse.json({
      id: 'new-chat-1',
      title: 'New Chat',
      started_at: '2024-01-03T00:00:00Z',
    }),
  )),
  http.get('/api/conversations/:id', withAuth(() =>
    HttpResponse.json([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there' },
    ]),
  )),
  http.put(
    '/api/conversations/:id',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
  http.delete(
    '/api/conversations/:id',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
  http.post('/api/conversations/:id/chat', withAuth(() =>
    HttpResponse.json('Assistant response here'),
  )),
]
