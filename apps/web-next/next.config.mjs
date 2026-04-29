const nextConfig = {
  reactStrictMode: true,
  rewrites: async () => [
    {
      source: '/favicon.ico',
      destination: '/favicon.svg',
    },
  ],
};

export default nextConfig;
