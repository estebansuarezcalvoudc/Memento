interface WsPayload {
  conversation_id?: string | null
  message: string
}

function dispatchEvents(instance: FakeWebSocket, payload: WsPayload) {
  const { conversation_id, message } = payload

  const send = (data: object) => {
    if (instance.onmessage) {
      instance.onmessage({ data: JSON.stringify(data) } as MessageEvent)
    }
  }

  if (!conversation_id) {
    send({
      type: 'conversation_created',
      conversation_id: 'new-chat-1',
      title: 'New Chat',
    })
  }

  send({ type: 'retrieving' })
  send({ type: 'token', content: `Echo: ${message}` })
  send({ type: 'done' })
}

class FakeWebSocket {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSING = 2
  static CLOSED = 3

  readyState = FakeWebSocket.OPEN
  onopen: ((ev: Event) => void) | null = null
  onmessage: ((ev: MessageEvent) => void) | null = null
  onerror: ((ev: Event) => void) | null = null
  onclose: ((ev: CloseEvent) => void) | null = null

  constructor(..._args: unknown[]) {
    setTimeout(() => {
      if (this.onopen) {
        this.onopen(new Event('open'))
      }
    }, 0)
  }

  send(data: string) {
    const payload = JSON.parse(data) as WsPayload
    setTimeout(() => dispatchEvents(this, payload), 0)
  }

  close() {
    this.readyState = FakeWebSocket.CLOSED
  }
}

export function createWsMock() {
  return FakeWebSocket
}
