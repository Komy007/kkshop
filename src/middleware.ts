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
        if (isLoggedIn) {
            const role = req.auth?.user?.role;
            if (role === 'SUPERADMIN') {
                return Response.redirect(new URL('/admin', nextUrl));
            } else if (role === 'ADMIN') {
                return Response.redirect(new URL('/admin/products/new', nextUrl));
            }
            // If just a regular USER accidentally hits /admin/login somehow and is logged in?
            return Response.redirect(new URL('/', nextUrl));
        }
        return;
    }

    // Require authentication for any other /admin route
    if (isAdminRoute) {
        if (!isLoggedIn) {
            return Response.redirect(new URL('/admin/login', nextUrl));
        }

        const role = req.auth?.user?.role;

        // General fallback: if you are just a "USER", you can't be in /admin
        if (role === 'USER') {
            return Response.redirect(new URL('/', nextUrl));
        }

        // --- Role-Based Access Control within /admin ---

        // 1. If you are just an ADMIN (not SUPERADMIN)
        if (role === 'ADMIN') {
            // Let's define routes ADMIN is explicitly allowed to see:
            const allowedForAdmin = [
                '/admin/products/new',
                '/admin/products',
                '/admin/products/translations',
                '/admin/inventory',
                '/admin/customers',
                '/admin/cs'
            ];

            // If the current path is NOT in the allowed list, force them to their dashboard (/admin/products/new)
            // (e.g. Trying to access /admin (Super Dashboard) or /admin/settings/roles)
            const isAllowedPath = allowedForAdmin.some(route => nextUrl.pathname.startsWith(route));

            // If they hit exactly '/admin' (the SuperAdmin dashboard), redirect to product reg
            if (nextUrl.pathname === '/admin' || !isAllowedPath) {
                return Response.redirect(new URL('/admin/products/new', nextUrl));
            }
        }

        // 2. SUPERADMIN has access to ALL /admin routes natively.
        return;
    }

    return;
}) as any;

// Specify which routes the middleware should run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg|.*\\.jpg|.*\\.jpeg).*)'],
}
