import { useRef, useState } from "react";
import { dinero, totalPresupuesto } from "../taller.js";
import Aviso from "./Aviso.jsx";

// Formulario controlado del presupuesto: diagnóstico, mano de obra y piezas.
// Al enviar llama a alGuardar({ diagnostico, manoObra, piezas }).
export default function FormularioPresupuesto({ ocupado, alGuardar }) {
  const [diagnostico, setDiagnostico] = useState("");
  const [manoObra, setManoObra] = useState("");
  const [piezas, setPiezas] = useState([]);
  const [error, setError] = useState("");

  // Cada renglón necesita una key estable aunque se borren otros. El
  // contador vive en un ref porque cambiarlo no tiene que repintar nada.
  const siguienteId = useRef(1);

  function agregarPieza() {
    const nueva = { id: siguienteId.current, descripcion: "", cantidad: "1", precio: "" };
    siguienteId.current += 1;
    setPiezas([...piezas, nueva]);
  }

  function cambiarPieza(id, campo, valor) {
    setPiezas(piezas.map((pieza) => (pieza.id === id ? { ...pieza, [campo]: valor } : pieza)));
  }

  function quitarPieza(id) {
    setPiezas(piezas.filter((pieza) => pieza.id !== id));
  }

  function enviar(evento) {
    evento.preventDefault();

    if (diagnostico.trim() === "") {
      setError("Escribe el diagnóstico.");
      return;
    }
    if (manoObra === "" || Number(manoObra) < 0) {
      setError("Indica la mano de obra (puede ser 0).");
      return;
    }
    for (const pieza of piezas) {
      if (pieza.descripcion.trim() === "" || !(Number(pieza.cantidad) > 0) || pieza.precio === "" || Number(pieza.precio) < 0) {
        setError("Revisa las piezas: descripción, cantidad mayor que cero y precio.");
        return;
      }
    }

    setError("");
    alGuardar({
      diagnostico: diagnostico.trim(),
      manoObra: Number(manoObra),
      // Al servidor solo van los tres campos del modelo, sin el id local.
      piezas: piezas.map((pieza) => ({
        descripcion: pieza.descripcion.trim(),
        cantidad: Number(pieza.cantidad),
        precio: Number(pieza.precio),
      })),
    });
  }

  return (
    <form className="formulario" onSubmit={enviar}>
      <label>
        Diagnóstico
        <textarea
          rows="3"
          value={diagnostico}
          onChange={(evento) => setDiagnostico(evento.target.value)}
        />
      </label>

      <label>
        Mano de obra
        <input
          type="number"
          min="0"
          step="0.01"
          value={manoObra}
          onChange={(evento) => setManoObra(evento.target.value)}
        />
      </label>

      <fieldset>
        <legend>Piezas</legend>
        {piezas.length === 0 && <p className="tenue">Sin piezas: solo mano de obra.</p>}
        {piezas.map((pieza) => (
          <div className="pieza" key={pieza.id}>
            <input
              type="text"
              placeholder="Descripción"
              aria-label="Descripción de la pieza"
              value={pieza.descripcion}
              onChange={(evento) => cambiarPieza(pieza.id, "descripcion", evento.target.value)}
            />
            <input
              type="number"
              min="1"
              placeholder="Cant."
              aria-label="Cantidad"
              value={pieza.cantidad}
              onChange={(evento) => cambiarPieza(pieza.id, "cantidad", evento.target.value)}
            />
            <input
              type="number"
              min="0"
              step="0.01"
              placeholder="Precio"
              aria-label="Precio unitario"
              value={pieza.precio}
              onChange={(evento) => cambiarPieza(pieza.id, "precio", evento.target.value)}
            />
            <button type="button" className="boton" onClick={() => quitarPieza(pieza.id)}>
              Quitar
            </button>
          </div>
        ))}
        <button type="button" className="boton" onClick={agregarPieza}>
          + Añadir pieza
        </button>
      </fieldset>

      {/* Dato derivado: se calcula en cada render, no se guarda en estado. */}
      <p className="total">
        Total: <strong>{dinero(totalPresupuesto(manoObra, piezas))}</strong>
      </p>

      <Aviso texto={error} />

      <button type="submit" className="boton boton-principal" disabled={ocupado}>
        Registrar presupuesto
      </button>
      <p className="tenue">Una vez registrado, el presupuesto no se puede modificar.</p>
    </form>
  );
}
