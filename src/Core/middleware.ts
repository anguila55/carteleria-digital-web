import { NextResponse, type NextRequest } from 'next/server'
import { protectedRoutes, publicRoutes } from '@/Core/Route'

export async function updateSession(request: NextRequest) {
  const { pathname } = new URL(request.url)

  const createRedirect = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone()
    url.pathname = path
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.set(key, value)
      })
    }
    return NextResponse.redirect(url)
  }

  const signOut = () => {
    const response = createRedirect('/')
    response.cookies.delete('auth_token')
    response.cookies.delete('version_token')
    return response
  }

  const cachedProfile = request.cookies.get('auth_token')?.value

  const isAuthenticated = !!cachedProfile
  const isProtectedRoute = protectedRoutes.includes(pathname)
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!isAuthenticated && isProtectedRoute) {
    return signOut()
  }

  if (isAuthenticated && isPublicRoute) {
    // Authenticated user trying to access public route - redirect to home
    return createRedirect('/home')
  }

  // For all other cases (authenticated accessing protected, or public routes), allow the request
  return NextResponse.next()
}
