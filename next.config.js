/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/me",
        destination: "/api/alist/me",
      },
      {
        source: "/api/auth/:path",
        destination: "/api/alist/auth/:path*",
      },
      {
        source: "/api/fs/:path",
        destination: "/api/alist/fs/:path*",
      },
      {
        source: "/api/public/:path",
        destination: "/api/alist/public/:path*",
      },
      {
        source: "/api/auth/admin/:path",
        destination: "/api/alist/admin/:path*",
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/md/:mdid/:accesskey",
        destination: "/",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/toolbox/localPlayer",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "Cross-Origin-Embedder-Policy",
            value: "require-corp",
          },
        ],
      },
    ];
  },
};

const withNextra = require("nextra")({
  theme: "nextra-theme-docs",
  themeConfig: "./theme.config.tsx",
});

module.exports = withNextra(nextConfig);
