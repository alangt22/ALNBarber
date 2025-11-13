/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
  eslint: {
    // Ignorar erros de lint durante o build
    ignoreDuringBuilds: true,
  },
    typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
