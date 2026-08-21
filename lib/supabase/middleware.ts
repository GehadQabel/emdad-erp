import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from '@/types/database.types'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjwyrcsdjefwgepckrmh.supabase.co'
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_XpnY0D-OYqTH7uSZLtUfXw_t_hXSbTM'

export async function updateSession(request: NextRequest) {
  try {
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createServerClient<Database>(
      SUPABASE_URL,
      SUPABASE_KEY,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            try {
              request.cookies.set({ name, value, ...options })
              response = NextResponse.next({ request: { headers: request.headers } })
              response.cookies.set({ name, value, ...options })
            } catch (e) {}
          },
          remove(name: string, options: CookieOptions) {
            try {
              request.cookies.set({ name, value: '', ...options })
              response = NextResponse.next({ request: { headers: request.headers } })
              response.cookies.set({ name, value: '', ...options })
            } catch (e) {}
          },
        },
      }
    )

    let user = null
    try {
      const { data } = await supabase.auth.getUser()
      user = data?.user || null
    } catch (err) {
      user = null
    }

    const isAuthPage = request.nextUrl.pathname.startsWith('/login')

    // Unauthenticated user trying to access protected routes -> redirect to /login
    if (!user && !isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }

    // Authenticated user trying to access /login -> redirect to dashboard /
    if (user && isAuthPage) {
      const url = request.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }

    return response
  } catch (err) {
    return NextResponse.next()
  }
}
