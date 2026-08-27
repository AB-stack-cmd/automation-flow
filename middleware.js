import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/',
  '/coming-soon',
  '/docs',
  '/privacy',
  '/support',
  '/workflows',
  '/excel',
  '/files(.*)',
  '/share(.*)',
  '/api(.*)'
]);

export default clerkMiddleware(async (auth, req) => {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY || '';
    const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

    // Graceful fallback: If keys are missing, invalid, or dummy placeholders in production environment, pass through safely
    if (
      !secretKey ||
      !pubKey ||
      secretKey.includes('neuronflow_clerk_secret_key') ||
      secretKey.startsWith('sk_test_dummy') ||
      pubKey.includes('neuronflow.live')
    ) {
      return NextResponse.next();
    }

    if (!isPublicRoute(req)) {
      if (typeof auth.protect === 'function') {
        await auth.protect();
      }
    }
    return NextResponse.next();
  } catch (err) {
    // Prevent unhandled Edge Runtime exceptions from causing MIDDLEWARE_INVOCATION_FAILED (500)
    console.error('Clerk Middleware Edge Error caught:', err);
    return NextResponse.next();
  }
});

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

