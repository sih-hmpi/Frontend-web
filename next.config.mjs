/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        canvas: false,
      };
      
      // Add PDF.js worker to client-side only
      // config.resolve.alias = {
      //   ...config.resolve.alias,
      //   'pdfjs-dist/build/pdf.worker.entry': require.resolve(
      //     'pdfjs-dist/build/pdf.worker.entry'
      //   ),
      // };
    }
    
    return config;
  },
}

export default nextConfig;