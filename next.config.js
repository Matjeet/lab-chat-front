/** @type {import('next').NextConfig} */
const nextConfig = {
  // Export estático: `next build` genera HTML/JS/CSS en `out/`,
  // que se sirve tal cual con Nginx/CDN (sin proceso Node en producción).
  output: 'export',

  reactStrictMode: true,

  // El optimizador de imágenes de Next necesita un servidor; en export estático
  // se desactiva y las <img> se sirven sin transformar.
  images: { unoptimized: true },

  // Quita el botón flotante de Next (indicador de dev, esquina inferior
  // izquierda). Solo afecta a `npm run dev`; no existe en el build de producción.
  devIndicators: false,

  // `blobatar`/`@blobatar/react` se publican solo como ESM, sin build CJS —
  // `next/jest` deriva su `transformIgnorePatterns` de esta lista (no de un
  // override manual en jest.config.js), así que sin esto Jest revienta con
  // "Unexpected token 'export'" al hacer `require()` de su `export { ... }`.
  transpilePackages: ['blobatar', '@blobatar/react'],

  // Orígenes (aparte de localhost) que pueden pedirle recursos de desarrollo
  // (`/_next/hmr`, etc.) a `npm run dev` — p. ej. al exponerlo con un túnel de
  // cloudflared. Los "quick tunnels" cambian de subdominio en cada ejecución,
  // así que va el comodín. Solo afecta a `npm run dev`.
  allowedDevOrigins: ['*.trycloudflare.com'],
};

module.exports = nextConfig;
