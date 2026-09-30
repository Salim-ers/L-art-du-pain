/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== "production";

const csp = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.stripe.com",
  "font-src 'self' data:",
  `connect-src 'self' https://api.stripe.com${isDev ? " ws:" : ""}`,
  "frame-src https://www.openstreetmap.org https://js.stripe.com https://hooks.stripe.com",
  "form-action 'self' https://checkout.stripe.com",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "object-src 'none'",
].join("; ");

const nextConfig = {
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // PGlite (base locale) et postgres-js restent des modules Node natifs.
    serverComponentsExternalPackages: ["@electric-sql/pglite", "postgres"],
    // Images compressées côté navigateur ; Vercel plafonne de toute façon une requête à 4,5 Mo.
    serverActions: { bodySizeLimit: "4.5mb" },
    // Les migrations SQL sont lues au démarrage : elles doivent être embarquées dans les fonctions Vercel.
    outputFileTracingIncludes: { "/**": ["./drizzle/**/*"] },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(self \"https://js.stripe.com\")" },
          ...(isDev ? [] : [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]),
        ],
      },
    ];
  },
};

export default nextConfig;
