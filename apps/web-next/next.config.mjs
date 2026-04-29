const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  rewrites: async () => [
    {
      source: '/favicon.ico',
      destination: '/favicon.svg',
    },
  ],
};

export default nextConfig;
