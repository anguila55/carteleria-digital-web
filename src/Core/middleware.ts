import { NextResponse, type NextRequest } from 'next/server'
import { protectedRoutes, publicRoutes } from '@/Core/Route'
import { signOutUser } from '@/Features/Authentication/Actions'

export async function updateSession(request: NextRequest) {
  const { pathname } = new URL(request.url)

  // Helper function to create redirect
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

  // Helper function to sign out user
  const signOut = async () => {
    await signOutUser()
    return createRedirect('/')
  }

  // Try to get cached profile from cookies
  const cachedProfile = request.cookies.get('auth_token')?.value

  // Check if user is authenticated
  const isAuthenticated = !!cachedProfile
  const isProtectedRoute = protectedRoutes.includes(pathname)
  const isPublicRoute = publicRoutes.includes(pathname)

  if (!isAuthenticated && isProtectedRoute) {
    // No authentication and trying to access protected route - redirect to login
    return await signOut()
  }

  if (isAuthenticated && isPublicRoute) {
    // Authenticated user trying to access public route - redirect to home
    return createRedirect('/home')
  }

  // For all other cases (authenticated accessing protected, or public routes), allow the request
  return NextResponse.next()
}
