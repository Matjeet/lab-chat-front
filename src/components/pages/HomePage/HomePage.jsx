'use client';

import { useState } from 'react';

import DefaultLayout from '../../templates/DefaultLayout';
import FormField from '../../molecules/FormField';
import Button from '../../atoms/Button';
import styles from './HomePage.module.css';

/**
 * Página: pantalla de entrada.
 * Ensambla plantilla + moléculas + átomos y añade el estado/lógica de la vista.
 * Sirve de ejemplo del flujo completo de Atomic Design.
 */
const HomePage = () => {
  const [name, setName] = useState('');
  const [greeting, setGreeting] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmed = name.trim();
    setGreeting(trimmed ? `Hola, ${trimmed} 👋` : 'Escribe tu nombre para continuar');
  };

  return (
    <DefaultLayout title="Chat">
      <form className={styles.form} onSubmit={handleSubmit}>
        <FormField
          id="nombre"
          label="Tu nombre"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Button type="submit">Entrar</Button>
      </form>

      {greeting && <p className={styles.greeting}>{greeting}</p>}
    </DefaultLayout>
  );
};

export default HomePage;
