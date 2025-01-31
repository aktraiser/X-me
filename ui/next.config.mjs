/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: 's2.googleusercontent.com',
      },
      {
        hostname: 'dam.malt.com',
      },
    ],
  },
  async rewrites() {
    const backendUrl = process.env.NODE_ENV === 'production' 
      ? 'http://xme-backend:3001'
      : 'http://localhost:3001';
      
    return [
      {
        source: '/api/:path*',
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;