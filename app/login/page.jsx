import LoginPage from '@/components/pages/LoginPage';

export const metadata = {
  title: 'Iniciar sesión · Chat',
};

/** Ruta "/login": inicio de sesión (solo UI/UX, sin backend conectado aún). */
const Page = () => <LoginPage />;

export default Page;
