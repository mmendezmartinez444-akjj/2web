// Reglas del taller. Es un módulo normal (no termina en .pb.js), así que
// PocketBase no lo carga solo: cada hook lo pide con require() dentro de su
// propia función, porque los hooks se ejecutan aislados y no ven variables
// declaradas fuera de ellos.
//
// Todas las funciones "error..." devuelven un texto con el motivo del rechazo,
// o null si no hay nada que objetar.

// Cambios de etapa permitidos. Lo que no aparece aquí no existe.
const TRANSICIONES = {
  solicitada: ["en_diagnostico", "cancelada"],
  en_diagnostico: ["presupuestada"],
  presupuestada: ["aprobada", "rechazada"],
  aprobada: ["en_reparacion"],
  en_reparacion: ["lista"],
  lista: ["entregada"],
  entregada: [],
  rechazada: [],
  cancelada: [],
}

const ESTADOS = Object.keys(TRANSICIONES)

// Campos que se fijan al recibir el equipo y campos del presupuesto.
const CAMPOS_RECEPCION = ["cliente", "equipo", "problema", "fotos"]
const CAMPOS_PRESUPUESTO = ["diagnostico", "manoObra", "piezas"]

// Convierte un Record de PocketBase en un objeto plano, para que las reglas
// de abajo trabajen con datos simples y no dependan de PocketBase.
function leerOrden(record) {
  const fotos = record.getStringSlice("fotos")
  let nombresFotos = ""
  for (let i = 0; i < fotos.length; i++) {
    nombresFotos += fotos[i] + "|"
  }

  return {
    estado: record.getString("estado"),
    cliente: record.getString("cliente"),
    equipo: record.getString("equipo"),
    problema: record.getString("problema"),
    fotos: nombresFotos,
    diagnostico: record.getString("diagnostico"),
    manoObra: record.getFloat("manoObra"),
    piezas: record.getString("piezas"), // el json llega como texto
  }
}

function esFinal(estado) {
  return TRANSICIONES[estado] !== undefined && TRANSICIONES[estado].length === 0
}

function errorTransicion(de, a) {
  const permitidas = TRANSICIONES[de]
  if (permitidas === undefined) {
    return 'La etapa "' + de + '" no existe.'
  }
  if (permitidas.indexOf(a) === -1) {
    return 'No se permite pasar de "' + de + '" a "' + a + '".'
  }
  return null
}

// Sin piezas vale: una reparación puede llevar solo mano de obra.
function sinPiezas(texto) {
  return texto === "" || texto === "null" || texto === "[]"
}

function errorPresupuesto(orden) {
  if (orden.diagnostico.trim() === "") {
    return "El presupuesto necesita un diagnóstico."
  }
  if (!(orden.manoObra >= 0)) {
    return "La mano de obra no puede ser negativa."
  }
  if (sinPiezas(orden.piezas)) {
    return null
  }

  let piezas
  try {
    piezas = JSON.parse(orden.piezas)
  } catch (err) {
    return "Las piezas deben ser una lista."
  }
  if (!Array.isArray(piezas)) {
    return "Las piezas deben ser una lista."
  }

  for (let i = 0; i < piezas.length; i++) {
    const pieza = piezas[i]
    const numero = i + 1
    if (pieza === null || typeof pieza !== "object") {
      return "La pieza " + numero + " no es válida."
    }
    if (typeof pieza.descripcion !== "string" || pieza.descripcion.trim() === "") {
      return "La pieza " + numero + " necesita una descripción."
    }
    if (typeof pieza.cantidad !== "number" || !(pieza.cantidad > 0)) {
      return "La cantidad de la pieza " + numero + " debe ser mayor que cero."
    }
    if (typeof pieza.precio !== "number" || !(pieza.precio >= 0)) {
      return "El precio de la pieza " + numero + " no puede ser negativo."
    }
  }
  return null
}

// Una orden siempre nace "solicitada" y sin presupuesto.
function errorCreacion(orden) {
  if (orden.estado !== "solicitada") {
    return 'Una orden nueva solo puede nacer como "solicitada".'
  }
  if (orden.diagnostico !== "" || orden.manoObra !== 0 || !sinPiezas(orden.piezas)) {
    return "El presupuesto se registra al presupuestar, no al crear la orden."
  }
  return null
}

// Toda actualización de una orden tiene que ser un cambio de etapa válido.
function errorActualizacion(antes, despues) {
  if (esFinal(antes.estado)) {
    return 'La orden está "' + antes.estado + '" y ya no cambia.'
  }
  if (antes.estado === despues.estado) {
    return "Una orden solo se actualiza para cambiar de etapa."
  }

  const error = errorTransicion(antes.estado, despues.estado)
  if (error) {
    return error
  }

  for (let i = 0; i < CAMPOS_RECEPCION.length; i++) {
    const campo = CAMPOS_RECEPCION[i]
    if (antes[campo] !== despues[campo]) {
      return 'El campo "' + campo + '" no se modifica después de registrar la orden.'
    }
  }

  // El presupuesto se escribe una sola vez: justo al presupuestar.
  if (antes.estado === "en_diagnostico" && despues.estado === "presupuestada") {
    return errorPresupuesto(despues)
  }

  for (let i = 0; i < CAMPOS_PRESUPUESTO.length; i++) {
    const campo = CAMPOS_PRESUPUESTO[i]
    if (antes[campo] !== despues[campo]) {
      return "El presupuesto solo se registra al presupuestar y no se modifica después."
    }
  }
  return null
}

module.exports = {
  TRANSICIONES: TRANSICIONES,
  ESTADOS: ESTADOS,
  leerOrden: leerOrden,
  errorTransicion: errorTransicion,
  errorPresupuesto: errorPresupuesto,
  errorCreacion: errorCreacion,
  errorActualizacion: errorActualizacion,
}
