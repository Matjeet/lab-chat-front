import Link from 'next/link';

import DefaultLayout from '../../templates/DefaultLayout';
import styles from './NotFoundPage.module.css';

/**
 * Página: 404. La monta `app/not-found.jsx` — Next.js la renderiza para
 * cualquier ruta que no exista y para llamadas explícitas a `notFound()`.
 * Sin estado ni efectos: no necesita `'use client'`.
 */
const NotFoundPage = () => (
  <DefaultLayout title="Página no encontrada" centered>
    <div className={styles.contenido}>
      {/* Decorativa: el texto de al lado ya explica el error, por eso alt="". */}
      <img
        src="/not-found.svg"
        alt=""
        width={750}
        height={750}
        className={styles.ilustracion}
      />
      <p className={styles.codigo}>404</p>
      <p className={styles.mensaje}>
        La página que buscas no existe, se movió o la URL tiene un error.
      </p>
      <Link href="/" className={styles.enlace}>
        Volver al inicio
      </Link>
    </div>
  </DefaultLayout>
);

export default NotFoundPage;
