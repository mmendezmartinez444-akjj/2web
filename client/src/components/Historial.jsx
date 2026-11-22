import { ETAPAS, NOMBRES, fecha } from "../taller.js";

// Línea de tiempo de la orden: el registro inicial más un renglón por evento.
export default function Historial({ orden, eventos }) {
  // Los eventos llegan ordenados por fecha. Si dos tienen la misma fecha
  // exacta, se desempata con el orden natural de las etapas.
  const ordenados = [...eventos].sort((x, y) => {
    if (x.created !== y.created) {
      return x.created < y.created ? -1 : 1;
    }
    return ETAPAS.indexOf(x.a) - ETAPAS.indexOf(y.a);
  });

  return (
    <ol className="historial">
      <li>
        <strong>Equipo recibido</strong>
        <time>{fecha(orden.created)}</time>
      </li>
      {ordenados.map((evento) => (
        <li key={evento.id}>
          <strong>
            {NOMBRES[evento.de] || evento.de} → {NOMBRES[evento.a] || evento.a}
          </strong>
          <time>{fecha(evento.created)}</time>
        </li>
      ))}
    </ol>
  );
}
