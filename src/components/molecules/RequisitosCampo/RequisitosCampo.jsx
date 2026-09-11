import styles from './RequisitosCampo.module.css';

/**
 * Molécula: lista de requisitos de un campo. Cada requisito se marca en verde
 * cuando `cumplido` es true.
 *
 * Presentacional: la evaluación se hace fuera, en
 * `src/utils/validacionRegistro.js` (`requisitosUsername`, `requisitosPassword`).
 *
 * @param {object} props
 * @param {string} [props.id]      Id para enlazar por `aria-describedby`.
 * @param {string} [props.titulo]
 * @param {{id: string, texto: string, cumplido: boolean}[]} props.requisitos
 */
const RequisitosCampo = ({
  id,
  titulo = 'El campo debe cumplir:',
  requisitos,
}) => (
  <div id={id} className={styles.contenedor}>
    <p className={styles.titulo}>{titulo}</p>
    <ul className={styles.lista}>
      {requisitos.map((requisito) => (
        <li
          key={requisito.id}
          className={requisito.cumplido ? styles.cumplido : styles.pendiente}
          data-estado={requisito.cumplido ? 'cumplido' : 'pendiente'}
        >
          <span className={styles.icono} aria-hidden="true">
            {requisito.cumplido ? '✓' : '○'}
          </span>
          {requisito.texto}
          <span className="sr-only">
            {requisito.cumplido ? ' (cumplido)' : ' (pendiente)'}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default RequisitosCampo;
