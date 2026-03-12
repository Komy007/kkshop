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
    const isSellerRoute = nextUrl.pathname.startsWith('/seller')
    const isAdminLoginRoute = nextUrl.pathname === '/admin/login'

    if (isApiAuthRoute) return

    // Allow access to /admin/login even if not authenticated
    if (isAdminLoginRoute) {
        if (isLoggedIn) {
            const role = req.auth?.user?.role;
            if (role === 'SUPERADMIN') return Response.redirect(new URL('/admin', nextUrl));
            if (role === 'ADMIN') return Response.redirect(new URL('/admin/products', nextUrl));
            if (role === 'SUPPLIER') return Response.redirect(new URL('/seller', nextUrl));
            // CONSUMER/USER is already logged in, but hit /admin/login? Push to home.
            return Response.redirect(new URL('/', nextUrl));
        }
        return;
    }

    // Role-Based Access Control (RBAC)
    if (isAdminRoute || isSellerRoute) {
        if (!isLoggedIn) {
            return Response.redirect(new URL('/admin/login', nextUrl));
        }

        const role = req.auth?.user?.role;

        // 1. Block regular users FROM ANY admin/seller routes
        if (role === 'USER' || !role) {
            return Response.redirect(new URL('/', nextUrl));
        }

        // 2. SUPPLIER access control
        if (role === 'SUPPLIER') {
            if (!isSellerRoute) {
                return Response.redirect(new URL('/seller', nextUrl));
            }
            return; // Allow access to /seller
        }

        // 3. ADMIN (Staff) access control within /admin
        if (role === 'ADMIN') {
            if (isSellerRoute) {
                return Response.redirect(new URL('/admin/products', nextUrl));
            }
            
            // ADMIN restricted paths
            const adminAllowedPrefixes = [
                '/admin/products',
                '/admin/inventory',
                '/admin/customers',
                '/admin/cs',
                '/admin/reviews'
            ];

            const isAllowed = adminAllowedPrefixes.some(p => nextUrl.pathname.startsWith(p));
            // Deny SUPERADMIN ONLY areas like Dashboard (Stats), Role Settings, Global Settings
            if (!isAllowed || nextUrl.pathname === '/admin') {
                return Response.redirect(new URL('/admin/products', nextUrl));
            }
            return;
        }

        // 4. SUPERADMIN has full access
        if (role === 'SUPERADMIN') {
            return;
        }

        // Default: if role unknown, go home
        return Response.redirect(new URL('/', nextUrl));
    }

    // --- Global Redirection for Suppliers if they wander into consumer view? ---
    // (Optional: let them see front store, but keep them in seller for management)
    
    // --- Onboarding: Mandatory for everyone logged in without a phone (Google users) ---
    const isOnboardingRoute = nextUrl.pathname === '/onboarding';
    if (isLoggedIn && (req.auth?.user as any)?.needsOnboarding && !isOnboardingRoute && !isAdminLoginRoute) {
        return Response.redirect(new URL('/onboarding', nextUrl));
    }

    return;
}) as any;

// Specify which routes the middleware should run on
export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg|.*\\.jpg|.*\\.jpeg).*)'],
}
