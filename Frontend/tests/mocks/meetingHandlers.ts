import { http, HttpResponse } from 'msw'

import { withAuth } from './withAuth'

export const mockMeetings = [
  { id: 'meeting-1', title: 'Team Meeting', date: '2024-01-15' },
  { id: 'meeting-2', title: 'Sprint Planning', date: '2024-01-22' },
]

export const meetingHandlers = [
  http.get(
    '/api/meetings',
    withAuth(() => HttpResponse.json(mockMeetings)),
  ),
  http.post(
    '/api/meetings',
    withAuth(() =>
      HttpResponse.json([
        { id: 'new-meeting-1', title: 'New Meeting', date: '2024-02-01' },
      ]),
    ),
  ),
  http.get(
    '/api/meetings/summary/:id',
    withAuth(() =>
      HttpResponse.json({
        summary: '## Summary\nContent here',
        title: 'Team Meeting',
        date: '2024-01-15',
      }),
    ),
  ),
  http.get(
    '/api/meetings/transcription/:id',
    withAuth(() =>
      HttpResponse.json({
        transcription: 'Speaker 1: Hello everyone',
        title: 'Team Meeting',
        date: '2024-01-15',
      }),
    ),
  ),
  http.patch(
    '/api/meetings/:id',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
  http.delete(
    '/api/meetings/:id',
    withAuth(() => new HttpResponse(null, { status: 204 })),
  ),
]
