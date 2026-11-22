import { useEffect, useState } from "react";
import { Outlet } from "react-router";
import { listarOrdenes, obtenerResumen } from "../api.js";
import { ETAPAS, SALIDAS, estaCerrada } from "../taller.js";
import Aviso from "../components/Aviso.jsx";
import Columna from "../components/Columna.jsx";

const SEGUNDOS_ENTRE_RECARGAS = 20;

// Visión de conjunto: una columna por etapa con sus órdenes.
// También es un diseño anidado: la orden abierta se pinta en su <Outlet />.
export default function Tablero() {
  const [ordenes, setOrdenes] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [error, setError] = useState("");
  const [verSalidas, setVerSalidas] = useState(false);
  const [recarga, setRecarga] = useState(0);

  // Lee el tablero del servidor al entrar y cada vez que cambia "recarga".
  useEffect(() => {
    const control = new AbortController();
    Promise.all([listarOrdenes(control.signal), obtenerResumen(control.signal)])
      .then(([lista, nuevoResumen]) => {
        setOrdenes(lista);
        setResumen(nuevoResumen);
        setError("");
      })
      .catch((fallo) => {
        if (fallo.name !== "AbortError") {
          setError(fallo.message);
        }
      });
    return () => control.abort();
  }, [recarga]);

  // El tablero suele quedarse abierto en una pantalla del taller: se vuelve
  // a leer cada cierto tiempo para reflejar lo que se hizo en otro equipo.
  // El temporizador es algo externo a React, así que se limpia al salir.
  useEffect(() => {
    const temporizador = setInterval(() => {
      setRecarga((n) => n + 1);
    }, SEGUNDOS_ENTRE_RECARGAS * 1000);
    return () => clearInterval(temporizador);
  }, []);

  function recargar() {
    setRecarga((n) => n + 1);
  }

  const lista = ordenes || [];
  const columnas = verSalidas ? [...ETAPAS, ...SALIDAS] : ETAPAS;
  const abiertas = lista.filter((orden) => !estaCerrada(orden.estado)).length;

  return (
    <div className="tablero-con-panel">
      <main className="tablero">
        <header className="tira">
          <p>
            {resumen ? (
              <>
                <strong>{abiertas}</strong> órdenes abiertas de <strong>{resumen.total}</strong> ·{" "}
                <strong>{resumen.porEstado.lista}</strong> listas para entregar
              </>
            ) : (
              "Cargando…"
            )}
          </p>
          <label className="conmutador">
            <input
              type="checkbox"
              checked={verSalidas}
              onChange={(evento) => setVerSalidas(evento.target.checked)}
            />
            Ver rechazadas y canceladas
          </label>
          <button type="button" className="boton" onClick={recargar}>
            Actualizar
          </button>
        </header>

        <Aviso texto={error} />

        <div className="columnas">
          {columnas.map((estado) => (
            <Columna
              key={estado}
              estado={estado}
              ordenes={lista.filter((orden) => orden.estado === estado)}
            />
          ))}
        </div>
      </main>

      {/* Aquí aparece PanelOrden cuando la URL es /orden/:id. Con el
          contexto, el panel puede avisar al tablero de que hubo un cambio. */}
      <Outlet context={{ alCambiar: recargar }} />
    </div>
  );
}
