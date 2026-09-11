import HomePage from '@/components/pages/HomePage';

/**
 * Ruta "/" del App Router.
 * La ruta solo conecta la URL con la página de Atomic Design correspondiente;
 * la lógica de la vista vive en el componente `HomePage`.
 */
const Page = () => <HomePage />;

export default Page;
