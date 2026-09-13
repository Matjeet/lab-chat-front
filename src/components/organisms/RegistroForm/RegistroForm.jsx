'use client';

import { useState } from 'react';

import FormField from '../../molecules/FormField';
import Button from '../../atoms/Button';
import Alert from '../../atoms/Alert';
import { registrarUsuario } from '../../../api/registro';
import {
  REGLAS,
  requisitosPassword,
  requisitosUsername,
  validarFormularioRegistro,
} from '../../../utils/validacionRegistro';
import styles from './RegistroForm.module.css';

const VALORES_INICIALES = { username: '', email: '', password: '' };

const MENSAJE_DUPLICADO =
  'No se pudo completar el registro. Revisa los datos e inténtalo de nuevo.';
const MENSAJE_SERVIDOR =
  'Hubo un problema al procesar el registro. Vuelve a intentarlo en unos momentos.';
const MENSAJE_RED =
  'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.';

/**
 * Organismo: formulario de alta de usuario contra `POST /api/v1/registro`.
 *
 * Valida en cliente (espejo de las reglas del contrato) antes de enviar, y al
 * recibir la respuesta reparte el error entre los campos o en un aviso general.
 * El `409` es genérico a propósito: nunca se atribuye a un campo.
 *
 * @param {object} props
 * @param {(usuario: import('../../../api/registro').RegistroResponse) => void} props.onRegistroCompleto
 */
const RegistroForm = ({ onRegistroCompleto }) => {
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

    const erroresCliente = validarFormularioRegistro(valores);
    if (Object.keys(erroresCliente).length > 0) {
      setErrores(erroresCliente);
      return;
    }
    setErrores({});
    setEnviando(true);

    const resultado = await registrarUsuario({
      username: valores.username.trim(),
      email: valores.email.trim().toLowerCase(),
      password: valores.password,
    });

    setEnviando(false);

    if (resultado.ok) {
      onRegistroCompleto(resultado.data);
      return;
    }

    const { error } = resultado;
    if (error.kind === 'validacion') {
      // El contrato pide mostrar textos propios por `field`, no el mensaje del servidor.
      const marcados = {};
      for (const campo of Object.keys(error.campos)) {
        marcados[campo] = REGLAS[campo] ?? 'Revisa este campo.';
      }
      setErrores(marcados);
      setAviso({ tipo: 'error', mensaje: 'Revisa los campos marcados.' });
    } else if (error.kind === 'duplicado') {
      setAviso({ tipo: 'error', mensaje: MENSAJE_DUPLICADO });
    } else if (error.kind === 'red') {
      setAviso({ tipo: 'error', mensaje: MENSAJE_RED });
    } else {
      setAviso({ tipo: 'error', mensaje: MENSAJE_SERVIDOR });
    }
  };

  return (
    <form className={styles.form} onSubmit={alEnviar} noValidate>
      {aviso && <Alert tipo={aviso.tipo}>{aviso.mensaje}</Alert>}

      <FormField
        id="username"
        name="username"
        label="Nombre de usuario"
        autoComplete="username"
        value={valores.username}
        error={errores.username}
        requisitos={requisitosUsername(valores.username)}
        onChange={alCambiar('username')}
      />

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
        autoComplete="new-password"
        value={valores.password}
        error={errores.password}
        requisitos={requisitosPassword(valores.password)}
        onChange={alCambiar('password')}
      />

      <Button
        type="submit"
        disabled={enviando}
        // Sin esto, el mousedown sobre el botón desenfoca antes la contraseña
        // (comportamiento por defecto del navegador al mover el foco), lo que
        // oculta RequisitosCampo y recoloca el botón entre el mousedown y el
        // mouseup — el click se pierde y hay que darle dos veces. Al evitar
        // el foco por defecto del mousedown, el layout no se mueve a mitad
        // del click y el primero ya envía el formulario. (jsdom no simula
        // este comportamiento del navegador, así que no hay forma fiable de
        // cubrirlo con un test — se verificó a mano en el navegador real.)
        onMouseDown={(evento) => evento.preventDefault()}
      >
        {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
      </Button>
    </form>
  );
};

export default RegistroForm;
