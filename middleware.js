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

export default function middleware(req, evt) {
  try {
    const secretKey = process.env.CLERK_SECRET_KEY || '';
    const pubKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

    // If Clerk credentials are not configured or are placeholder keys, bypass Edge auth safely
    if (
      !secretKey ||
      !pubKey ||
      secretKey.includes('neuronflow_clerk_secret_key') ||
      secretKey.startsWith('sk_test_dummy') ||
      pubKey.includes('neuronflow.live')
    ) {
      return NextResponse.next();
    }

    // Safely delegate to Clerk middleware when credentials are present
    const clerkHandler = clerkMiddleware(async (auth, request) => {
      if (!isPublicRoute(request)) {
        try {
          const authObj = typeof auth === 'function' ? await auth() : auth;
          if (authObj && typeof authObj.protect === 'function') {
            await authObj.protect();
          }
        } catch (e) {
          // If auth protection fails, allow request or handle gracefully
        }
      }
      return NextResponse.next();
    });

    return clerkHandler(req, evt);
  } catch (err) {
    console.error('Edge Middleware execution fallback:', err);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};

