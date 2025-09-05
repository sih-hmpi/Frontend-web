/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  webpack: (config, { isServer }) => {
    // This allows the app to include worker files
    config.resolve.alias.canvas = false;
    
    if (isServer) {
      config.externals.push({
        canvas: 'commonjs canvas',
        'pdfjs-dist': 'commonjs pdfjs-dist',
      });
    }
    
    return config;
  },
  optimizeFonts: false,
}

export default nextConfig
