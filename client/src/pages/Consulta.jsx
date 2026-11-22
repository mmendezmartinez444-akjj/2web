import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { listarOrdenes } from "../api.js";
import { coincide, fecha, nombreCliente, telefonoCliente } from "../taller.js";
import Aviso from "../components/Aviso.jsx";
import Insignia from "../components/Insignia.jsx";
import Pasos from "../components/Pasos.jsx";

// Pantalla para atender el teléfono: se escribe el nombre, el teléfono o
// el equipo y aparece en qué etapa está cada orden de ese cliente.
export default function Consulta() {
  const [ordenes, setOrdenes] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState("");
  const buscador = useRef(null);

  useEffect(() => {
    const control = new AbortController();
    listarOrdenes(control.signal)
      .then(setOrdenes)
      .catch((fallo) => {
        if (fallo.name !== "AbortError") {
          setError(fallo.message);
        }
      });
    return () => control.abort();
  }, []);

  // El cursor queda en el buscador nada más entrar.
  useEffect(() => {
    buscador.current.focus();
  }, []);

  const hayBusqueda = busqueda.trim() !== "";
  const resultados = hayBusqueda ? ordenes.filter((orden) => coincide(orden, busqueda)) : [];

  return (
    <main className="pagina">
      <h1>¿En qué punto va mi equipo?</h1>
      <input
        ref={buscador}
        className="buscador"
        type="search"
        placeholder="Nombre, teléfono o equipo del cliente"
        value={busqueda}
        onChange={(evento) => setBusqueda(evento.target.value)}
      />

      <Aviso texto={error} />

      {!hayBusqueda && <p className="tenue">Escribe para buscar entre {ordenes.length} órdenes.</p>}
      {hayBusqueda && resultados.length === 0 && (
        <p className="tenue">Ninguna orden coincide con «{busqueda}».</p>
      )}

      <ul className="resultados">
        {resultados.map((orden) => (
          <li key={orden.id}>
            <div>
              <strong>{orden.equipo}</strong>
              <span>
                {nombreCliente(orden)} · {telefonoCliente(orden)}
              </span>
              <span className="tenue">Recibido el {fecha(orden.created)}</span>
            </div>
            <div className="estado-resultado">
              <Insignia estado={orden.estado} />
              <Pasos estado={orden.estado} />
              <Link to={"/orden/" + orden.id}>Ver historial</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
