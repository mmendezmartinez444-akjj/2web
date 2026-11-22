import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { crearCliente, crearOrden, listarClientes } from "../api.js";
import Aviso from "../components/Aviso.jsx";
import PasoCliente from "../components/PasoCliente.jsx";
import PasoEquipo from "../components/PasoEquipo.jsx";
import SelectorFotos from "../components/SelectorFotos.jsx";

const PASOS = ["Cliente", "Equipo", "Fotos"];

// Recepción de un equipo en tres pasos. Todo el estado del formulario vive
// aquí; cada paso es un componente pequeño que lo recibe por props.
export default function Recibir() {
  const navegar = useNavigate();

  const [paso, setPaso] = useState(0);
  const [clientes, setClientes] = useState([]);
  const [cliente, setCliente] = useState({ esNuevo: false, id: "", nombre: "", telefono: "" });
  const [equipo, setEquipo] = useState("");
  const [problema, setProblema] = useState("");
  const [fotos, setFotos] = useState([]);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const control = new AbortController();
    listarClientes(control.signal)
      .then((lista) => {
        setClientes(lista);
        // Sin clientes registrados solo queda la opción de crear uno.
        if (lista.length === 0) {
          setCliente((actual) => ({ ...actual, esNuevo: true }));
        }
      })
      .catch((fallo) => {
        if (fallo.name !== "AbortError") {
          setError(fallo.message);
        }
      });
    return () => control.abort();
  }, []);

  // Devuelve el motivo por el que no se puede salir del paso actual.
  function errorDelPaso() {
    if (paso === 0) {
      if (cliente.esNuevo && (cliente.nombre.trim() === "" || cliente.telefono.trim() === "")) {
        return "Escribe el nombre y el teléfono del cliente.";
      }
      if (!cliente.esNuevo && cliente.id === "") {
        return "Elige un cliente o registra uno nuevo.";
      }
    }
    if (paso === 1 && (equipo.trim() === "" || problema.trim() === "")) {
      return "Indica el equipo y describe el problema.";
    }
    return "";
  }

  async function registrar() {
    setEnviando(true);
    try {
      let clienteId = cliente.id;
      if (cliente.esNuevo) {
        const creado = await crearCliente({
          nombre: cliente.nombre.trim(),
          telefono: cliente.telefono.trim(),
        });
        clienteId = creado.id;
        // Si la orden fallara ahora, el cliente ya existe: se deja elegido
        // para que un segundo intento no lo duplique.
        setClientes([...clientes, creado]);
        setCliente({ esNuevo: false, id: creado.id, nombre: "", telefono: "" });
      }
      const orden = await crearOrden({
        cliente: clienteId,
        equipo: equipo.trim(),
        problema: problema.trim(),
        fotos,
      });
      navegar("/orden/" + orden.id);
    } catch (fallo) {
      setError(fallo.message);
      setEnviando(false);
    }
  }

  // Un solo submit para todo: en los dos primeros pasos avanza y en el
  // último registra la orden.
  function enviar(evento) {
    evento.preventDefault();
    const motivo = errorDelPaso();
    setError(motivo);
    if (motivo) {
      return;
    }
    if (paso < PASOS.length - 1) {
      setPaso(paso + 1);
    } else {
      registrar();
    }
  }

  const clienteElegido = clientes.find((registrado) => registrado.id === cliente.id);

  return (
    <main className="pagina">
      <h1>Recibir equipo</h1>

      <ol className="asistente">
        {PASOS.map((nombre, indice) => (
          <li key={nombre} className={indice === paso ? "actual" : indice < paso ? "hecho" : ""}>
            <span>{indice + 1}</span>
            {nombre}
          </li>
        ))}
      </ol>

      <form className="caja" onSubmit={enviar}>
        {paso === 0 && <PasoCliente clientes={clientes} cliente={cliente} alCambiar={setCliente} />}

        {paso === 1 && (
          <PasoEquipo
            equipo={equipo}
            problema={problema}
            alCambiarEquipo={setEquipo}
            alCambiarProblema={setProblema}
          />
        )}

        {paso === 2 && (
          <>
            <SelectorFotos fotos={fotos} alCambiar={setFotos} />
            <dl className="repaso">
              <dt>Cliente</dt>
              <dd>{cliente.esNuevo ? cliente.nombre + " (nuevo)" : clienteElegido?.nombre}</dd>
              <dt>Equipo</dt>
              <dd>{equipo}</dd>
              <dt>Problema</dt>
              <dd>{problema}</dd>
            </dl>
          </>
        )}

        <Aviso texto={error} />

        <div className="acciones">
          {paso > 0 && (
            <button type="button" className="boton" onClick={() => setPaso(paso - 1)}>
              Atrás
            </button>
          )}
          <button type="submit" className="boton boton-principal" disabled={enviando}>
            {paso < PASOS.length - 1 ? "Siguiente" : enviando ? "Guardando…" : "Registrar orden"}
          </button>
        </div>
      </form>
    </main>
  );
}
