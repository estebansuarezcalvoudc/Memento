import { HttpResponse, type HttpResponseResolver } from 'msw'

export function withAuth(resolver: HttpResponseResolver): HttpResponseResolver {
  return info => {
    const auth = info.request.headers.get('Authorization')
    if (!auth?.startsWith('Bearer ')) {
      return new HttpResponse(null, { status: 401 })
    }
    return resolver(info)
  }
}
