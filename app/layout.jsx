import { Comic_Neue } from 'next/font/google';
import Script from 'next/script';

import { InterlocutorProvider } from '@/context/InterlocutorContext';
import '@/styles/tokens.css';
import '@/styles/global.css';

export const metadata = {
  title: 'Chat',
  description: 'Frontend del proyecto Chat',
};

// Fuente decorativa para texto puntual (ver --font-display en tokens.css).
// next/font la autoaloja en el build (sin llamada a Google Fonts en runtime,
// compatible con el export estático) y la expone como variable CSS.
const comicNeue = Comic_Neue({
  weight: ['300', '400', '700'],
  subsets: ['latin'],
  variable: '--font-comic-neue',
  display: 'swap',
});

// Se ejecuta antes de pintar: si el usuario forzó un tema, lo aplica a <html>
// para evitar el parpadeo (FOUC) del tema por defecto.
const aplicarTemaGuardado = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

/**
 * Layout raíz del App Router: envuelve a todas las rutas.
 * Es el único sitio donde se importa CSS global (tokens + reset).
 */
const RootLayout = ({ children }) => (
  <html lang="es" className={comicNeue.variable} suppressHydrationWarning>
    <body>
      <Script id="tema-inicial" strategy="beforeInteractive">
        {aplicarTemaGuardado}
      </Script>
      <InterlocutorProvider>{children}</InterlocutorProvider>
    </body>
  </html>
);

export default RootLayout;
