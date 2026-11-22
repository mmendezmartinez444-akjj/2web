import { ACCIONES } from "../taller.js";

// Botones de la etapa actual. No cambia nada por sí mismo: avisa al padre
// con alElegir(etapaDestino) y el padre hace la petición.
export default function Acciones({ estado, ocupado, alElegir }) {
  const acciones = ACCIONES[estado] || [];
  if (acciones.length === 0) {
    return null;
  }

  function elegir(accion) {
    if (accion.confirmar && !window.confirm(accion.confirmar)) {
      return;
    }
    alElegir(accion.a);
  }

  return (
    <div className="acciones">
      {acciones.map((accion) => (
        <button
          key={accion.a}
          type="button"
          className={accion.peligro ? "boton boton-peligro" : "boton boton-principal"}
          disabled={ocupado}
          onClick={() => elegir(accion)}
        >
          {accion.texto}
        </button>
      ))}
    </div>
  );
}
