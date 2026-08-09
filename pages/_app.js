import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';

const rawKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';
const publishableKey = (rawKey && !rawKey.includes('neuronflow.live'))
  ? rawKey
  : 'pk_test_Y2xlcmsuY2xlcmsuYWNjb3VudHMuZGV2JA';

export default function MyApp({ Component, pageProps }) {
  return (
    <ClerkProvider
      publishableKey={publishableKey}
      {...pageProps}
    >
      <Component {...pageProps} />
    </ClerkProvider>
  );
}
