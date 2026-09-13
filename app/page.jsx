import LoginPage from '@/components/pages/LoginPage';

/**
 * Ruta "/" del App Router.
 * Arranca directo en el inicio de sesión — es la puerta de entrada de la app.
 * La ruta solo conecta la URL con la página de Atomic Design correspondiente;
 * la lógica de la vista vive en el componente `LoginPage`.
 */
const Page = () => <LoginPage />;

export default Page;
