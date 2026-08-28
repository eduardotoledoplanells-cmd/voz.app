import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent MIME-type sniffing
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Prevent Clickjacking via iFrames
  { key: "X-Frame-Options", value: "DENY" },
  // Enable XSS Auditor in legacy browsers
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Strict Referrer Policy
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Enforce HSTS (Strict Transport Security for HTTPS)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
  // Restrict sensitive browser features
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" }
];

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  // TypeScript & ESLint settings
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // Redirect old Vercel URL to official domain
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'server-taupe-six.vercel.app' }],
        destination: 'https://lyvo.media/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-user-id, x-admin-key" },
          ...securityHeaders
        ]
      },
      {
        source: "/((?!api/).*)",
        headers: securityHeaders
      }
    ]
  }
};

export default nextConfig;
