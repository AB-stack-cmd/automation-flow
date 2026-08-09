import React from 'react';
import { SignUp } from '@clerk/nextjs';
import Head from 'next/head';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <>
      <Head>
        <title>Sign Up | NEURON_FLOW</title>
      </Head>
      <div className="min-h-screen bg-[#121212] text-[#f4f4f5] flex flex-col items-center justify-center p-6 relative">
        <div className="absolute top-6 left-6">
          <Link
            href="/"
            className="px-4 py-2 bg-[#18181b] border border-[#27272a] hover:border-[#ff4f00] text-xs font-semibold rounded-md text-[#a1a1aa] hover:text-white transition"
          >
            ← Back to Dashboard
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-md bg-[#ff4f00] flex items-center justify-center text-white font-bold text-xl shadow-md">
            ⚡
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white">NEURON_FLOW</span>
        </div>
        <SignUp
          path="/sign-up"
          routing="path"
          signInUrl="/sign-in"
          redirectUrl="/"
        />
      </div>
    </>
  );
}
