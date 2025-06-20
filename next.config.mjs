/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed dangerous error suppression - let TypeScript and ESLint catch real issues
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  images: {
    unoptimized: true,
  },
}

export default nextConfig
