import { NOMBRES } from "../taller.js";
import TarjetaOrden from "./TarjetaOrden.jsx";

// Una columna del tablero: una etapa y las órdenes que están en ella.
export default function Columna({ estado, ordenes }) {
  return (
    <section className={"columna columna-" + estado}>
      <h2>
        {NOMBRES[estado]} <span>{ordenes.length}</span>
      </h2>
      {ordenes.length === 0 && <p className="hueco">Vacía</p>}
      {ordenes.map((orden) => (
        <TarjetaOrden key={orden.id} orden={orden} />
      ))}
    </section>
  );
}
