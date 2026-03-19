import { describe, expect, it, vi } from 'vitest'

import { createMessageHandler } from '../../../../src/api/chat/chatMessageHandler'
import { CHATS_KEY } from '../../../../src/api/chat/chatQueryKeys'

describe('chatMessageHandler', () => {
  it('invalidates chats query when title event arrives', () => {
    const dispatch = vi.fn()
    const queryClient = {
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn(),
    }
    const ws = { close: vi.fn() }

    const handler = createMessageHandler({
      dispatch,
      queryClient: queryClient as never,
      message: 'hello',
      resolvedConvIdRef: { current: null },
      accumulatedTokensRef: { current: '' },
      ws: ws as never,
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
