import { NavLink } from "react-router";
import { dinero, fecha, nombreCliente, totalPresupuesto } from "../taller.js";

// Tarjeta de una orden en el tablero. Es un enlace: al pulsarla cambia la
// URL a /orden/:id y el panel lateral se abre solo.
export default function TarjetaOrden({ orden }) {
  const tienePresupuesto = orden.diagnostico !== "";

  return (
    <NavLink to={"/orden/" + orden.id} className="tarjeta">
      <strong>{orden.equipo}</strong>
      <span>{nombreCliente(orden)}</span>
      <span className="tenue">{fecha(orden.created)}</span>
      {tienePresupuesto && (
        <span className="importe">{dinero(totalPresupuesto(orden.manoObra, orden.piezas))}</span>
      )}
    </NavLink>
  );
}
