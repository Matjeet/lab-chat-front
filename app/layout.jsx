import Script from 'next/script';

import '@/styles/tokens.css';
import '@/styles/global.css';

export const metadata = {
  title: 'Chat',
  description: 'Frontend del proyecto Chat',
};

// Se ejecuta antes de pintar: si el usuario forzó un tema, lo aplica a <html>
// para evitar el parpadeo (FOUC) del tema por defecto.
const aplicarTemaGuardado = `(function(){try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.dataset.theme=t;}}catch(e){}})();`;

/**
 * Layout raíz del App Router: envuelve a todas las rutas.
 * Es el único sitio donde se importa CSS global (tokens + reset).
 */
const RootLayout = ({ children }) => (
  <html lang="es" suppressHydrationWarning>
    <body>
      <Script id="tema-inicial" strategy="beforeInteractive">
        {aplicarTemaGuardado}
      </Script>
      {children}
    </body>
  </html>
);

export default RootLayout;
