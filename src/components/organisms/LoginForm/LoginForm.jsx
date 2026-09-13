'use client';

import { useState } from 'react';

import FormField from '../../molecules/FormField';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import { validarFormularioLogin } from '../../../utils/validacionLogin';
import styles from './LoginForm.module.css';

const VALORES_INICIALES = { email: '', password: '' };

const MENSAJE_SIN_CONECTAR =
  'Formulario válido. Falta conectar el inicio de sesión con el backend.';

/**
 * Organismo: formulario de inicio de sesión.
 *
 * Solo la UI/UX por ahora: valida en cliente (email con formato válido,
 * contraseña no vacía — sin exigir la política de fortaleza de registro, eso
 * no aplica a una cuenta ya existente) y no llama a ningún servicio de
 * autenticación todavía.
 *
 * Si se pasa `onIniciarSesion`, se le entregan los datos ya validados y
 * normalizados cuando el envío es correcto (para que quien conecte el
 * backend más adelante no tenga que tocar este componente). Sin esa prop,
 * el propio formulario avisa de que aún falta conectar el backend.
 *
 * @param {object} props
 * @param {(datos: {email: string, password: string}) => void} [props.onIniciarSesion]
 */
const LoginForm = ({ onIniciarSesion }) => {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);

  const alCambiar = (campo) => (evento) => {
    const { value } = evento.target;
    setValores((prev) => ({ ...prev, [campo]: value }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };

  const alEnviar = (evento) => {
    evento.preventDefault();
    setAviso(null);

    const erroresCliente = validarFormularioLogin(valores);
    if (Object.keys(erroresCliente).length > 0) {
      setErrores(erroresCliente);
      return;
    }
    setErrores({});

    const datos = {
      email: valores.email.trim().toLowerCase(),
      password: valores.password,
    };

    if (onIniciarSesion) {
      onIniciarSesion(datos);
      return;
    }

    setAviso({ tipo: 'info', mensaje: MENSAJE_SIN_CONECTAR });
  };

  return (
    <form className={styles.form} onSubmit={alEnviar} noValidate>
      {aviso && <Alert tipo={aviso.tipo}>{aviso.mensaje}</Alert>}

      <FormField
        id="email"
        name="email"
        type="email"
        label="Correo electrónico"
        autoComplete="email"
        value={valores.email}
        error={errores.email}
        onChange={alCambiar('email')}
      />

      <FormField
        id="password"
        name="password"
        type="password"
        label="Contraseña"
        autoComplete="current-password"
        value={valores.password}
        error={errores.password}
        onChange={alCambiar('password')}
      />

      <Button type="submit">Iniciar sesión</Button>
    </form>
  );
};

export default LoginForm;
