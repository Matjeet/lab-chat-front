'use client';

import DefaultLayout from '../../templates/DefaultLayout';
import Button from '../../atoms/Button';
import Input from '../../atoms/Input';
import FormField from '../../molecules/FormField';
import styles from './StyleGuidePage.module.css';

const COLORES = [
  '--color-bg',
  '--color-surface',
  '--color-surface-muted',
  '--color-border',
  '--color-border-strong',
  '--color-text',
  '--color-text-muted',
  '--color-text-subtle',
  '--color-primary',
  '--color-primary-hover',
  '--color-primary-active',
  '--color-primary-soft',
  '--color-on-primary',
  '--color-success',
  '--color-warning',
  '--color-danger',
  '--color-danger-soft',
  '--color-focus-ring',
];

const TEXTOS = [
  ['--font-size-2xl', 'Encabezado 2xl'],
  ['--font-size-xl', 'Encabezado xl'],
  ['--font-size-lg', 'Subtítulo lg'],
  ['--font-size-md', 'Cuerpo md (base)'],
  ['--font-size-sm', 'Secundario sm'],
  ['--font-size-xs', 'Nota xs'],
];

const PESOS = [
  ['--font-weight-regular', 'Regular 400'],
  ['--font-weight-medium', 'Medium 500'],
  ['--font-weight-semibold', 'Semibold 600'],
  ['--font-weight-bold', 'Bold 700'],
];

const ESPACIOS = [
  '--space-1',
  '--space-2',
  '--space-3',
  '--space-4',
  '--space-5',
  '--space-6',
  '--space-7',
  '--space-8',
];

const RADIOS = ['--radius-sm', '--radius-md', '--radius-lg', '--radius-full'];
const SOMBRAS = ['--shadow-sm', '--shadow-md'];

const Section = ({ title, children }) => (
  <section className={styles.section}>
    <h2 className={styles.sectionTitle}>{title}</h2>
    {children}
  </section>
);

/**
 * Página: guía de estilo viva.
 * Renderiza los tokens de `tokens.css` y los componentes en sus variantes.
 * Sirve de referencia visual y para detectar regresiones (incl. en modo oscuro,
 * usando el selector de tema de la cabecera).
 */
const StyleGuidePage = () => (
  <DefaultLayout title="Sistema de diseño">
    <p className={styles.intro}>
      Fuente de verdad: <code>src/styles/tokens.css</code>. Cambia el tema desde
      la cabecera para revisar el modo oscuro.
    </p>

    <Section title="Colores">
      <ul className={styles.swatches}>
        {COLORES.map((token) => (
          <li key={token} className={styles.swatch}>
            <span
              className={styles.swatchColor}
              style={{ backgroundColor: `var(${token})` }}
            />
            <code>{token}</code>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Tipografía">
      <ul className={styles.stack}>
        {TEXTOS.map(([token, ejemplo]) => (
          <li key={token} style={{ fontSize: `var(${token})` }}>
            {ejemplo} <code>{token}</code>
          </li>
        ))}
      </ul>
      <ul className={styles.stack}>
        {PESOS.map(([token, ejemplo]) => (
          <li key={token} style={{ fontWeight: `var(${token})` }}>
            {ejemplo} <code>{token}</code>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Espaciado">
      <ul className={styles.stack}>
        {ESPACIOS.map((token) => (
          <li key={token} className={styles.spaceRow}>
            <span
              className={styles.spaceBar}
              style={{ width: `var(${token})` }}
            />
            <code>{token}</code>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Radios y sombras">
      <div className={styles.boxes}>
        {RADIOS.map((token) => (
          <div
            key={token}
            className={styles.box}
            style={{ borderRadius: `var(${token})` }}
          >
            <code>{token}</code>
          </div>
        ))}
        {SOMBRAS.map((token) => (
          <div
            key={token}
            className={styles.box}
            style={{ boxShadow: `var(${token})` }}
          >
            <code>{token}</code>
          </div>
        ))}
      </div>
    </Section>

    <Section title="Botones">
      <div className={styles.row}>
        <Button variant="primary">Primary</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="danger">Danger</Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
      </div>
    </Section>

    <Section title="Campos de formulario">
      <div className={styles.stack}>
        <Input value="" onChange={() => {}} placeholder="Input suelto" />
        <FormField
          id="sg-ok"
          label="Campo con label"
          placeholder="Escribe algo"
          value=""
          onChange={() => {}}
        />
        <FormField
          id="sg-error"
          label="Campo con error"
          error="Mensaje de validación"
          value=""
          onChange={() => {}}
        />
      </div>
    </Section>
  </DefaultLayout>
);

export default StyleGuidePage;
