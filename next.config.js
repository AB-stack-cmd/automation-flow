import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@clerk/nextjs'],
  outputFileTracingRoot: path.resolve(process.cwd()),
};


export default nextConfig;
