import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { cambiarEtapa, listarEventos, obtenerOrden, presupuestar } from "../api.js";
import { fecha, nombreCliente, telefonoCliente } from "../taller.js";
import Acciones from "./Acciones.jsx";
import Aviso from "./Aviso.jsx";
import FormularioPresupuesto from "./FormularioPresupuesto.jsx";
import Fotos from "./Fotos.jsx";
import Historial from "./Historial.jsx";
import Insignia from "./Insignia.jsx";
import Pasos from "./Pasos.jsx";
import Presupuesto from "./Presupuesto.jsx";

// Panel lateral con todo lo de una orden: datos, presupuesto, acciones de
// la etapa e historial. Recibe el id y avisa al tablero con alCambiar().
export default function FichaOrden({ id, alCambiar }) {
  const navegar = useNavigate();

  const [orden, setOrden] = useState(null);
  const [eventos, setEventos] = useState([]);
  const [error, setError] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [recarga, setRecarga] = useState(0);

  // La orden y su historial se leen siempre del servidor: al abrir el panel
  // y después de cada acción. Lo que se ve es lo que hay guardado.
  useEffect(() => {
    const control = new AbortController();
    Promise.all([obtenerOrden(id, control.signal), listarEventos(id, control.signal)])
      .then(([nuevaOrden, nuevosEventos]) => {
        setOrden(nuevaOrden);
        setEventos(nuevosEventos);
      })
      .catch((fallo) => {
        if (fallo.name !== "AbortError") {
          setError(fallo.message);
        }
      });
    return () => control.abort();
  }, [id, recarga]);

  // Escape cierra el panel. El teclado se escucha en window, fuera de
  // React, así que el efecto quita el listener al desmontarse.
  useEffect(() => {
    function alPulsar(evento) {
      if (evento.key === "Escape") {
        navegar("/");
      }
    }
    window.addEventListener("keydown", alPulsar);
    return () => window.removeEventListener("keydown", alPulsar);
  }, [navegar]);

  // Ejecuta una acción contra el servidor y, salga bien o mal, vuelve a
  // leer la orden y pide al tablero que se recargue.
  async function ejecutar(accion) {
    setOcupado(true);
    setError("");
    try {
      await accion();
    } catch (fallo) {
      setError(fallo.message);
    }
    setRecarga((n) => n + 1);
    alCambiar();
    setOcupado(false);
  }

  const cerrar = (
    <Link to="/" className="cerrar" aria-label="Cerrar panel">
      ×
    </Link>
  );

  if (!orden) {
    return (
      <aside className="panel">
        {cerrar}
        <Aviso texto={error} />
        {!error && <p className="tenue">Cargando orden…</p>}
      </aside>
    );
  }

  const tienePresupuesto = orden.diagnostico !== "";

  return (
    <aside className="panel">
      {cerrar}
      <Insignia estado={orden.estado} />
      <h1>{orden.equipo}</h1>
      <Pasos estado={orden.estado} />

      <Aviso texto={error} />

      <Acciones
        estado={orden.estado}
        ocupado={ocupado}
        alElegir={(etapa) => ejecutar(() => cambiarEtapa(orden.id, etapa))}
      />

      {orden.estado === "en_diagnostico" && (
        <section>
          <h2>Proponer presupuesto</h2>
          <FormularioPresupuesto
            ocupado={ocupado}
            alGuardar={(datos) => ejecutar(() => presupuestar(orden.id, datos))}
          />
        </section>
      )}

      <section>
        <h2>Cliente</h2>
        <p>
          {nombreCliente(orden)} · {telefonoCliente(orden)}
        </p>
        <h2>Problema</h2>
        <p>{orden.problema}</p>
        <p className="tenue">Recibido el {fecha(orden.created)}</p>
        <Fotos orden={orden} />
      </section>

      {tienePresupuesto && (
        <section>
          <h2>Presupuesto</h2>
          <Presupuesto
            diagnostico={orden.diagnostico}
            manoObra={orden.manoObra}
            piezas={orden.piezas}
          />
        </section>
      )}

      <section>
        <h2>Historial</h2>
        <Historial orden={orden} eventos={eventos} />
      </section>
    </aside>
  );
}
