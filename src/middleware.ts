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
    const isSupplierOldRoute = nextUrl.pathname.startsWith('/supplier')
    const isAdminLoginRoute = nextUrl.pathname === '/admin/login'

    if (isApiAuthRoute) return

    // Block admin API access when 2FA is pending (except 2FA verify endpoint itself)
    const isAdminApiRoute = nextUrl.pathname.startsWith('/api/admin');
    const is2FAApiRoute = nextUrl.pathname.startsWith('/api/admin/2fa');
    if (isAdminApiRoute && !is2FAApiRoute && isLoggedIn && (req.auth?.user as any)?.twoFactorPending) {
        return new Response(
            JSON.stringify({ error: '2FA verification required' }),
            { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // Skip middleware for other API routes (handled by route handlers)
    if (nextUrl.pathname.startsWith('/api')) return

    // Redirect all legacy /supplier/* paths to the canonical /seller/* equivalent
    if (isSupplierOldRoute) {
        const newPath = nextUrl.pathname.replace(/^\/supplier(\/register)?.*/, (_, reg) =>
            reg ? '/seller/register' : '/seller'
        );
        return Response.redirect(new URL(newPath, nextUrl));
    }

    const is2FAVerifyRoute = nextUrl.pathname === '/admin/2fa-verify';

    // Allow access to /admin/login even if not authenticated
    if (isAdminLoginRoute) {
        if (isLoggedIn) {
            const role = req.auth?.user?.role;
            if (role === 'SUPERADMIN') return Response.redirect(new URL('/admin', nextUrl));
            if (role === 'ADMIN') return Response.redirect(new URL('/admin/products', nextUrl));
            if (role === 'SUPPLIER') return Response.redirect(new URL('/seller', nextUrl));
            return Response.redirect(new URL('/', nextUrl));
        }
        return;
    }

    // 2FA 검증 대기 중: /admin/2fa-verify 로 강제 리다이렉트
    if (isLoggedIn && (req.auth?.user as any)?.twoFactorPending && !is2FAVerifyRoute) {
        if (isAdminRoute || isSellerRoute) {
            return Response.redirect(new URL('/admin/2fa-verify', nextUrl));
        }
    }
    // 2FA 이미 처리됐으면 /admin/2fa-verify 접근 불필요
    if (isLoggedIn && !(req.auth?.user as any)?.twoFactorPending && is2FAVerifyRoute) {
        const role = req.auth?.user?.role;
        const dest = role === 'SUPERADMIN' ? '/admin'
                   : role === 'SUPPLIER'   ? '/seller'
                   : '/admin/products';
        return Response.redirect(new URL(dest, nextUrl));
    }

    // Role-Based Access Control (RBAC)
    if (isAdminRoute || isSellerRoute) {
        if (!isLoggedIn) {
            return Response.redirect(new URL('/admin/login', nextUrl));
        }

        const role = req.auth?.user?.role;

        // 1. Block regular users FROM ANY admin/seller routes
        //    Exception: /seller/register is open so any user can apply to become a seller
        if (role === 'USER' || !role) {
            if (nextUrl.pathname === '/seller/register') return;
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
                '/admin/orders',
                '/admin/inventory',
                '/admin/customers',
                '/admin/cs',
                '/admin/reviews',
                '/admin/coupons',
                '/admin/2fa-verify',
                '/admin/settings/security',
                '/admin/categories',
                '/admin/marketing',
                '/admin/analytics',
                '/admin/change-password',
            ];

            const isAllowed = adminAllowedPrefixes.some(p => nextUrl.pathname.startsWith(p))
                || nextUrl.pathname === '/admin'; // allow dashboard home
            // Deny SUPERADMIN ONLY areas (suppliers, global settings, etc.)
            if (!isAllowed) {
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

    // --- Auto-redirect SUPPLIER to /seller when they land on the consumer front ---
    if (isLoggedIn && req.auth?.user?.role === 'SUPPLIER') {
        return Response.redirect(new URL('/seller', nextUrl));
    }
    
    // --- Onboarding: Mandatory for everyone logged in without a phone (Google users) ---
    const isOnboardingRoute = nextUrl.pathname === '/onboarding';
    if (isLoggedIn && (req.auth?.user as any)?.needsOnboarding && !isOnboardingRoute && !isAdminLoginRoute) {
        return Response.redirect(new URL('/onboarding', nextUrl));
    }

    return;
}) as any;

// Specify which routes the middleware should run on
// 1) All pages (excluding static assets)
// 2) /api/admin/* explicitly (for 2FA enforcement) — but NOT /api/auth/*
export const config = {
    matcher: [
        '/((?!api|_next/static|_next/image|favicon.ico|.*\\.png|.*\\.webp|.*\\.svg|.*\\.jpg|.*\\.jpeg).*)',
        '/api/admin/:path*',
    ],
}
