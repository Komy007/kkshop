import NextAuth from "next-auth"
import authConfig from "./auth.config"

// We initialize NextAuth with the edge-compatible config for middleware
const nextAuthEnv = NextAuth(authConfig);
export const middleware = nextAuthEnv.auth as any;

export default middleware((req: any) => {
    const { nextUrl } = req
    const isLoggedIn = !!req.auth
    const isApiAuthRoute = nextUrl.pathname.startsWith('/api/auth')
    const isAdminRoute = nextUrl.pathname.startsWith('/admin')
    const isAdminLoginRoute = nextUrl.pathname === '/admin/login'

    if (isApiAuthRoute) return

    // Allow access to /admin/login even if not authenticated
    if (isAdminLoginRoute) {
        if (isLoggedIn && req.auth?.user?.role === 'ADMIN') {
            return Response.redirect(new URL('/admin/products/new', nextUrl))
        }
        return
    }

    // Require authentication and ADMIN role for any other /admin route
    if (isAdminRoute) {
        if (!isLoggedIn || req.auth?.user?.role !== 'ADMIN') {
            return Response.redirect(new URL('/admin/login', nextUrl))
        }
        return
    }

    return
}) as any;

// Specify which routes the middleware should run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg|.*\\.jpg|.*\\.jpeg).*)'],
}
