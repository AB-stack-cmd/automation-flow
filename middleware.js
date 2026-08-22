import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export default function middleware(req, event) {
  const secretKey = process.env.CLERK_SECRET_KEY;
  // If Clerk key is dummy/placeholder or missing, bypass Clerk authentication
  if (!secretKey || secretKey.includes('neuronflow_clerk_secret_key') || secretKey.startsWith('sk_test_dummy')) {
    return NextResponse.next();
  }

  try {
    return clerkMiddleware()(req, event);
  } catch (error) {
    console.warn('Clerk middleware error, bypassing:', error.message);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    // Skip Next.js internals and static files
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API & TRPC routes
    '/(api|trpc)(.*)',
    // Clerk auto-proxy path
    '/__clerk/:path*',
  ],
};

