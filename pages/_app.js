import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_Y2xlcmsubmV1cm9uZmxvdy5saXZlJA'}
      {...pageProps}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
