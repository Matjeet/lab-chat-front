import NotFoundPage from '@/components/pages/NotFoundPage';

export const metadata = {
  title: 'Página no encontrada · Chat',
};

/**
 * Archivo especial del App Router: Next.js la renderiza para cualquier ruta
 * que no exista y para llamadas explícitas a `notFound()`. Con
 * `output: 'export'` se genera como `out/404.html`.
 */
const NotFound = () => <NotFoundPage />;

export default NotFound;
