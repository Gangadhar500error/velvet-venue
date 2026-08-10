import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "i.pravatar.cc",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.ytimg.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "i.pinimg.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/venues",
        destination: "/",
        permanent: true,
      },
      {
        source: "/coworking",
        destination: "/",
        permanent: true,
      },
      {
        source: "/coworking/:city",
        destination: "/venues/:city",
        permanent: true,
      },
      {
        source: "/coworking/:city/:id",
        destination: "/venues/:city/:id",
        permanent: true,
      },
      {
        source: "/meeting-room",
        destination: "/",
        permanent: true,
      },
      {
        source: "/meeting-room/:city",
        destination: "/venues/:city",
        permanent: true,
      },
      {
        source: "/meeting-room/:city/:id",
        destination: "/venues/:city/:id",
        permanent: true,
      },
      {
        source: "/private-office",
        destination: "/",
        permanent: true,
      },
      {
        source: "/private-office/:city",
        destination: "/venues/:city",
        permanent: true,
      },
      {
        source: "/private-office/:city/:id",
        destination: "/venues/:city/:id",
        permanent: true,
      },
      {
        source: "/virtual-office",
        destination: "/",
        permanent: true,
      },
      {
        source: "/virtual-office/:city",
        destination: "/venues/:city",
        permanent: true,
      },
      {
        source: "/virtual-office/:city/:id",
        destination: "/venues/:city/:id",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
