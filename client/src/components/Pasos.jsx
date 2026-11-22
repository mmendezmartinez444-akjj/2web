import { ETAPAS, NOMBRES, SALIDAS, etapaAlcanzada } from "../taller.js";

// Progreso compacto: un punto por etapa del camino normal.
export default function Pasos({ estado }) {
  const cerradaSinReparar = SALIDAS.includes(estado);
  const actual = ETAPAS.indexOf(etapaAlcanzada(estado));

  return (
    <ol className={cerradaSinReparar ? "pasos pasos-detenidos" : "pasos"}>
      {ETAPAS.map((etapa, indice) => (
        <li
          key={etapa}
          className={indice <= actual ? "hecho" : ""}
          title={NOMBRES[etapa]}
          aria-label={NOMBRES[etapa]}
        />
      ))}
    </ol>
  );
}
