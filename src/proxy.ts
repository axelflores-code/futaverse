import {
  createServerClient,
} from '@supabase/ssr'

import {
  NextResponse,
  type NextRequest,
} from 'next/server'

const PROTECTED_ROUTES = [
  '/biblioteca',
  '/perfil',
  '/settings',
]

const AUTH_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
]

function matchesRoute(
  pathname: string,
  routes: string[]
): boolean {
  return routes.some(
    (route) =>
      pathname === route ||
      pathname.startsWith(
        `${route}/`
      )
  )
}

export async function proxy(
  request: NextRequest
) {
  let response =
    NextResponse.next({
      request,
    })

  const supabase =
    createServerClient(
      process.env
        .NEXT_PUBLIC_SUPABASE_URL!,

      process.env
        .NEXT_PUBLIC_SUPABASE_ANON_KEY!,

      {
        cookies: {
          getAll() {
            return request
              .cookies
              .getAll()
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value
                )
              }
            )

            response =
              NextResponse.next({
                request,
              })

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options
                )
              }
            )
          },
        },
      }
    )

  const pathname =
    request.nextUrl.pathname

  const isProtectedRoute =
    matchesRoute(
      pathname,
      PROTECTED_ROUTES
    )

  const isAuthRoute =
    matchesRoute(
      pathname,
      AUTH_ROUTES
    )

  /*
   * El matcher ya limita las rutas,
   * pero conservamos esta protección.
   */
  if (
    !isProtectedRoute &&
    !isAuthRoute
  ) {
    return response
  }

  const {
    data: {
      user,
    },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error(
      'Error comprobando sesión:',
      error.message
    )
  }

  if (
    isProtectedRoute &&
    !user
  ) {
    const loginUrl =
      request.nextUrl.clone()

    loginUrl.pathname =
      '/login'

    loginUrl.searchParams.set(
      'redirectTo',
      pathname
    )

    return NextResponse.redirect(
      loginUrl
    )
  }

  if (
    isAuthRoute &&
    user
  ) {
    const homeUrl =
      request.nextUrl.clone()

    homeUrl.pathname = '/'
    homeUrl.search = ''

    return NextResponse.redirect(
      homeUrl
    )
  }

  return response
}

/*
 * El proxy se ejecutará únicamente
 * cuando realmente necesitemos conocer
 * la sesión del usuario.
 */
export const config = {
  matcher: [
    '/biblioteca/:path*',
    '/perfil/:path*',
    '/settings/:path*',
    '/login/:path*',
    '/register/:path*',
    '/reset-password/:path*',
  ],
}