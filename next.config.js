/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  turbopack: {
    root: process.cwd()
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com"
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com"
      },
      {
        protocol: "https",
        hostname: "i.vimeocdn.com"
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh4.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh5.googleusercontent.com"
      },
      {
        protocol: "https",
        hostname: "lh6.googleusercontent.com"
      }
    ]
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
