// Todas las peticiones al servidor pasan por aquí, con fetch.
// Los componentes no conocen las URL de PocketBase: llaman a estas funciones.

const PB_URL = import.meta.env.VITE_PB_URL || "http://127.0.0.1:8090";
const API = PB_URL + "/api/collections";

// PocketBase responde los errores como { message, data: { campo: { message } } }.
function mensajeDeError(datos, status) {
  if (status === 404) {
    return "Ese registro no existe en el servidor.";
  }
  if (!datos) {
    return "El servidor respondió con el error " + status + ".";
  }
  const detalles = Object.entries(datos.data || {}).map(
    ([campo, error]) => campo + ": " + error.message,
  );
  if (detalles.length > 0) {
    return datos.message + " " + detalles.join(" ");
  }
  return datos.message || "El servidor respondió con el error " + status + ".";
}

async function pedir(url, opciones) {
  let respuesta;
  try {
    respuesta = await fetch(url, opciones);
  } catch (error) {
    // Una petición abortada (el componente se desmontó) se deja pasar tal cual.
    if (error.name === "AbortError") {
      throw error;
    }
    throw new Error("No se pudo conectar con el servidor. ¿Está PocketBase encendido?");
  }

  const datos = await respuesta.json().catch(() => null);
  if (!respuesta.ok) {
    throw new Error(mensajeDeError(datos, respuesta.status));
  }
  return datos;
}

function enviarJson(metodo, url, cuerpo) {
  return pedir(url, {
    method: metodo,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cuerpo),
  });
}

// ----------------------------------------------------------------- clientes

export async function listarClientes(signal) {
  const datos = await pedir(API + "/clientes/records?perPage=500&sort=nombre", { signal });
  return datos.items;
}

export function crearCliente(cliente) {
  return enviarJson("POST", API + "/clientes/records", cliente);
}

// ------------------------------------------------------------------ órdenes

// expand=cliente hace que cada orden traiga dentro los datos de su cliente.
export async function listarOrdenes(signal) {
  const datos = await pedir(API + "/ordenes/records?perPage=500&sort=-created&expand=cliente", {
    signal,
  });
  return datos.items;
}

export function obtenerOrden(id, signal) {
  return pedir(API + "/ordenes/records/" + id + "?expand=cliente", { signal });
}

// Las fotos son archivos, así que la orden se envía como FormData
// (multipart) y no como JSON. El estado no se envía: lo pone el servidor.
export function crearOrden({ cliente, equipo, problema, fotos }) {
  const formulario = new FormData();
  formulario.append("cliente", cliente);
  formulario.append("equipo", equipo);
  formulario.append("problema", problema);
  for (const foto of fotos) {
    formulario.append("fotos", foto);
  }
  return pedir(API + "/ordenes/records", { method: "POST", body: formulario });
}

export function cambiarEtapa(id, estado) {
  return enviarJson("PATCH", API + "/ordenes/records/" + id, { estado });
}

// Presupuestar es el único cambio de etapa que además lleva datos.
export function presupuestar(id, { diagnostico, manoObra, piezas }) {
  return enviarJson("PATCH", API + "/ordenes/records/" + id, {
    estado: "presupuestada",
    diagnostico,
    manoObra,
    piezas,
  });
}

export function urlFoto(orden, nombre) {
  return PB_URL + "/api/files/ordenes/" + orden.id + "/" + nombre;
}

// ------------------------------------------------------------------ eventos

export async function listarEventos(ordenId, signal) {
  const filtro = encodeURIComponent('orden="' + ordenId + '"');
  const datos = await pedir(API + "/eventos/records?perPage=100&sort=created&filter=" + filtro, {
    signal,
  });
  return datos.items;
}

// ------------------------------------------------------------------ resumen

// Ruta propia del servidor: { total, porEstado: { solicitada: 1, ... } }
export function obtenerResumen(signal) {
  return pedir(PB_URL + "/api/resumen", { signal });
}
