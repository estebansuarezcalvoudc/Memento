import type { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'

import { createMessageHandler } from '../../../../src/api/chat/chatMessageHandler'
import { CHATS_KEY } from '../../../../src/api/chat/chatQueryKeys'

describe('chatMessageHandler', () => {
  it('invalidates chats query when title event arrives', () => {
    const dispatch = vi.fn()
    const queryClient: Pick<QueryClient, 'setQueryData' | 'invalidateQueries'> =
      {
        setQueryData: vi.fn(),
        invalidateQueries: vi.fn().mockResolvedValue(undefined),
      }
    const ws: Pick<WebSocket, 'close'> = { close: vi.fn() }

    const handler = createMessageHandler({
      dispatch,
      queryClient,
      message: 'hello',
      resolvedConvIdRef: { current: null },
      accumulatedTokensRef: { current: '' },
      ws,
    })

    handler({
      data: JSON.stringify({ type: 'title', title: 'New title' }),
    } as MessageEvent<string>)

    expect(queryClient.invalidateQueries).toHaveBeenCalledWith({
      queryKey: CHATS_KEY,
    })
    expect(ws.close).not.toHaveBeenCalled()
    expect(dispatch).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ERROR' }),
    )
  })
})
