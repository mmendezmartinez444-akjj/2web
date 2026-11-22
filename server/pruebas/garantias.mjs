// Comprueba las garantías del servidor hablando directamente con la API,
// sin pasar por la interfaz. Necesita Node 18 o superior.
//
//   node pruebas/garantias.mjs
//   node pruebas/garantias.mjs http://127.0.0.1:8090
//
// Crea un cliente y varias órdenes de prueba (se quedan guardados).

const PB = process.argv[2] || "http://127.0.0.1:8090"
const API = PB + "/api/collections"

let fallos = 0

function comprobar(descripcion, condicion, detalle) {
  if (condicion) {
    console.log("  ok     " + descripcion)
  } else {
    fallos++
    console.log("  FALLO  " + descripcion + (detalle ? "  -> " + detalle : ""))
  }
}

async function pedir(metodo, ruta, cuerpo) {
  const respuesta = await fetch(PB + ruta, {
    method: metodo,
    headers: cuerpo ? { "Content-Type": "application/json" } : undefined,
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  })
  let datos = null
  try {
    datos = await respuesta.json()
  } catch {
    // respuesta sin cuerpo
  }
  return { status: respuesta.status, datos }
}

const rechazada = (r) => r.status >= 400 && r.status < 500
const texto = (r) => r.status + " " + JSON.stringify(r.datos)

async function nuevaOrden(clienteId, equipo) {
  const r = await pedir("POST", "/api/collections/ordenes/records", {
    cliente: clienteId,
    equipo,
    problema: "Prueba automática",
  })
  return r.datos
}

async function avanzar(id, estado, extra) {
  return pedir("PATCH", "/api/collections/ordenes/records/" + id, { estado, ...extra })
}

async function eventosDe(id) {
  const filtro = encodeURIComponent('orden="' + id + '"')
  const r = await pedir("GET", "/api/collections/eventos/records?perPage=100&filter=" + filtro)
  return r.datos.items
}

const PRESUPUESTO = {
  diagnostico: "Conector de carga dañado",
  manoObra: 1000,
  piezas: [{ descripcion: "Conector USB-C", cantidad: 2, precio: 350 }],
}

console.log("Servidor: " + PB + "\n")

// ---------------------------------------------------------------- creación
console.log("Creación")
const cliente = (
  await pedir("POST", "/api/collections/clientes/records", {
    nombre: "Cliente de prueba",
    telefono: "5550-0000",
  })
).datos
comprobar("se puede registrar un cliente", Boolean(cliente && cliente.id))

const orden = await nuevaOrden(cliente.id, "Equipo A")
comprobar("una orden nueva nace solicitada", orden && orden.estado === "solicitada")

let r = await pedir("POST", "/api/collections/ordenes/records", {
  cliente: cliente.id,
  equipo: "Tramposa",
  problema: "x",
  estado: "entregada",
})
comprobar("no se puede crear una orden ya entregada", rechazada(r), texto(r))

r = await pedir("POST", "/api/collections/ordenes/records", {
  cliente: cliente.id,
  equipo: "Tramposa",
  problema: "x",
  manoObra: 500,
})
comprobar("no se puede crear una orden con presupuesto", rechazada(r), texto(r))

r = await pedir("POST", "/api/collections/ordenes/records", { equipo: "Sin cliente", problema: "x" })
comprobar("una orden necesita cliente", rechazada(r), texto(r))

// ------------------------------------------------------- orden del proceso
console.log("\nOrden del proceso")
r = await avanzar(orden.id, "presupuestada", PRESUPUESTO)
comprobar("no se salta de solicitada a presupuestada", rechazada(r), texto(r))

r = await avanzar(orden.id, "entregada")
comprobar("no se salta de solicitada a entregada", rechazada(r), texto(r))

r = await avanzar(orden.id, "rechazada")
comprobar("rechazada solo se alcanza desde presupuestada", rechazada(r), texto(r))

r = await pedir("PATCH", "/api/collections/ordenes/records/" + orden.id, { equipo: "Otro equipo" })
comprobar("no se editan los datos sin cambiar de etapa", rechazada(r), texto(r))

r = await avanzar(orden.id, "en_diagnostico", { equipo: "Otro equipo" })
comprobar("no se cambian los datos de recepción al avanzar", rechazada(r), texto(r))

r = await avanzar(orden.id, "en_diagnostico", { manoObra: 999 })
comprobar("no se escribe presupuesto fuera de su etapa", rechazada(r), texto(r))

r = await avanzar(orden.id, "en_diagnostico")
comprobar("solicitada -> en_diagnostico", r.status === 200, texto(r))

r = await avanzar(orden.id, "cancelada")
comprobar("no se cancela después de empezar la revisión", rechazada(r), texto(r))

r = await avanzar(orden.id, "solicitada")
comprobar("no se vuelve atrás", rechazada(r), texto(r))

// ------------------------------------------------------------- presupuesto
console.log("\nPresupuesto")
r = await avanzar(orden.id, "presupuestada", { diagnostico: "", manoObra: 100, piezas: [] })
comprobar("el presupuesto necesita diagnóstico", rechazada(r), texto(r))

r = await avanzar(orden.id, "presupuestada", {
  diagnostico: "x",
  manoObra: 100,
  piezas: [{ descripcion: "Pieza", cantidad: 0, precio: 10 }],
})
comprobar("no se aceptan piezas con cantidad cero", rechazada(r), texto(r))

r = await avanzar(orden.id, "presupuestada", {
  diagnostico: "x",
  manoObra: 100,
  piezas: [{ descripcion: "Pieza", cantidad: 1, precio: -5 }],
})
comprobar("no se aceptan piezas con precio negativo", rechazada(r), texto(r))

r = await avanzar(orden.id, "presupuestada", PRESUPUESTO)
comprobar("en_diagnostico -> presupuestada con presupuesto", r.status === 200, texto(r))
comprobar(
  "el presupuesto queda guardado y el total no se guarda",
  r.datos && r.datos.manoObra === 1000 && r.datos.piezas.length === 1 && r.datos.total === undefined,
)

r = await avanzar(orden.id, "aprobada", { manoObra: 1 })
comprobar("el presupuesto no se modifica después", rechazada(r), texto(r))

r = await avanzar(orden.id, "aprobada", { piezas: [] })
comprobar("las piezas no se modifican después", rechazada(r), texto(r))

// ------------------------------------------------------------ resto del flujo
console.log("\nResto del flujo")
for (const estado of ["aprobada", "en_reparacion", "lista", "entregada"]) {
  r = await avanzar(orden.id, estado)
  comprobar("-> " + estado, r.status === 200, texto(r))
}

r = await avanzar(orden.id, "lista")
comprobar("una orden entregada no cambia más", rechazada(r), texto(r))

const cancelable = await nuevaOrden(cliente.id, "Equipo B")
r = await avanzar(cancelable.id, "cancelada")
comprobar("solicitada -> cancelada", r.status === 200, texto(r))
r = await avanzar(cancelable.id, "en_diagnostico")
comprobar("una orden cancelada no cambia más", rechazada(r), texto(r))

const rechazable = await nuevaOrden(cliente.id, "Equipo C")
await avanzar(rechazable.id, "en_diagnostico")
await avanzar(rechazable.id, "presupuestada", PRESUPUESTO)
r = await avanzar(rechazable.id, "rechazada")
comprobar("presupuestada -> rechazada", r.status === 200, texto(r))
r = await avanzar(rechazable.id, "aprobada")
comprobar("una orden rechazada no cambia más", rechazada(r), texto(r))

// ---------------------------------------------------------------- historial
console.log("\nHistorial")
const eventos = await eventosDe(orden.id)
comprobar("hay un evento por cada cambio de etapa (6)", eventos.length === 6, "hay " + eventos.length)
comprobar(
  "cada evento tiene de, a y fecha",
  eventos.every((ev) => ev.de && ev.a && ev.created),
)
comprobar(
  "los intentos rechazados no dejan eventos",
  (await eventosDe(cancelable.id)).length === 1 && (await eventosDe(rechazable.id)).length === 3,
)

const unEvento = eventos[0]
r = await pedir("PATCH", "/api/collections/eventos/records/" + unEvento.id, { a: "entregada" })
comprobar("los eventos no se editan", rechazada(r), texto(r))

r = await pedir("DELETE", "/api/collections/eventos/records/" + unEvento.id)
comprobar("los eventos no se borran", rechazada(r), texto(r))

r = await pedir("POST", "/api/collections/eventos/records", {
  orden: orden.id,
  de: "lista",
  a: "entregada",
})
comprobar("nadie inventa eventos por la API", rechazada(r), texto(r))

// ------------------------------------------------------------------ borrados
console.log("\nBorrados")
r = await pedir("DELETE", "/api/collections/ordenes/records/" + orden.id)
comprobar("las órdenes no se borran", rechazada(r), texto(r))

r = await pedir("DELETE", "/api/collections/clientes/records/" + cliente.id)
comprobar("los clientes no se borran", rechazada(r), texto(r))

// ------------------------------------------------------------------- resumen
console.log("\nRuta propia")
r = await pedir("GET", "/api/resumen")
comprobar(
  "GET /api/resumen cuenta las órdenes por etapa",
  r.status === 200 && r.datos && typeof r.datos.porEstado.entregada === "number",
  texto(r),
)

console.log("\n" + (fallos === 0 ? "Todo correcto." : fallos + " comprobación(es) fallaron."))
process.exit(fallos === 0 ? 0 : 1)
