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

// Un solo mensaje por `kind`, nunca "email incorrecto" / "contraseña
// incorrecta" por separado — mismo criterio que ya sigue chat-registro con
// su 409 genérico, para no facilitar enumeración de cuentas.
const MENSAJES_ERROR = {
  credenciales: 'Correo o contraseña incorrectos.',
  'demasiados-intentos': 'Demasiados intentos. Espera un momento y vuelve a intentarlo.',
  red: 'No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.',
  desconocido: 'Hubo un problema al iniciar sesión. Vuelve a intentarlo en unos momentos.',
};

/**
 * Organismo: formulario de inicio de sesión.
 *
 * Valida en cliente (email con formato válido, contraseña no vacía — sin
 * exigir la política de fortaleza de registro, no aplica a una cuenta ya
 * existente).
 *
 * Si se pasa `onIniciarSesion`, se le entregan los datos ya validados y
 * normalizados; puede devolver (opcionalmente como promesa) un resultado
 * tipado `{ ok: true, ... } | { ok: false, error: { kind } }` — con
 * `ok: false` este formulario muestra el aviso correspondiente y
 * deshabilita el botón mientras se resuelve. El éxito (qué hacer con la
 * sesión: redirigir, guardar el token...) es decisión de quien conecte el
 * backend, no de este formulario. Sin esa prop, se limita a avisar que aún
 * falta conectar el backend.
 *
 * @param {object} props
 * @param {(datos: {email: string, password: string}) => (void | Promise<{ok: boolean, error?: {kind: string}}>)} [props.onIniciarSesion]
 */
const LoginForm = ({ onIniciarSesion }) => {
  const [valores, setValores] = useState(VALORES_INICIALES);
  const [errores, setErrores] = useState({});
  const [aviso, setAviso] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const alCambiar = (campo) => (evento) => {
    const { value } = evento.target;
    setValores((prev) => ({ ...prev, [campo]: value }));
    setErrores((prev) => (prev[campo] ? { ...prev, [campo]: undefined } : prev));
  };

  const alEnviar = async (evento) => {
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

    if (!onIniciarSesion) {
      setAviso({ tipo: 'info', mensaje: MENSAJE_SIN_CONECTAR });
      return;
    }

    setEnviando(true);
    const resultado = await onIniciarSesion(datos);
    setEnviando(false);

    if (resultado?.ok === false) {
      setAviso({
        tipo: 'error',
        mensaje: MENSAJES_ERROR[resultado.error?.kind] ?? MENSAJES_ERROR.desconocido,
      });
    }
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

      <Button type="submit" disabled={enviando}>
        {enviando ? 'Iniciando sesión…' : 'Iniciar sesión'}
      </Button>
    </form>
  );
};

export default LoginForm;
