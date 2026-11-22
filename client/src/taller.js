// Conocimiento del taller que necesita la interfaz: nombres de las etapas,
// qué acciones ofrece cada una y cómo se calcula el total.
// Esto solo sirve para mostrar botones y textos. Quien decide de verdad si
// un cambio es válido es el servidor (pb_hooks).

// Camino normal de una orden, en orden.
export const ETAPAS = [
  "solicitada",
  "en_diagnostico",
  "presupuestada",
  "aprobada",
  "en_reparacion",
  "lista",
  "entregada",
];

// Salidas: la orden se cierra sin reparar.
export const SALIDAS = ["rechazada", "cancelada"];

export const TODAS = [...ETAPAS, ...SALIDAS];

export const NOMBRES = {
  solicitada: "Solicitada",
  en_diagnostico: "En diagnóstico",
  presupuestada: "Presupuestada",
  aprobada: "Aprobada",
  en_reparacion: "En reparación",
  lista: "Lista",
  entregada: "Entregada",
  rechazada: "Rechazada",
  cancelada: "Cancelada",
};

// Botones que se ofrecen en cada etapa. "en_diagnostico" no tiene botón
// porque de ahí se sale con el formulario del presupuesto.
export const ACCIONES = {
  solicitada: [
    { a: "en_diagnostico", texto: "Empezar revisión" },
    {
      a: "cancelada",
      texto: "Cancelar orden",
      peligro: true,
      confirmar: "¿Cancelar la orden a petición del cliente? No se puede deshacer.",
    },
  ],
  presupuestada: [
    { a: "aprobada", texto: "El cliente aprueba" },
    {
      a: "rechazada",
      texto: "El cliente rechaza",
      peligro: true,
      confirmar: "¿Anotar que el cliente rechaza el presupuesto? La orden se cierra sin reparar.",
    },
  ],
  aprobada: [{ a: "en_reparacion", texto: "Empezar reparación" }],
  en_reparacion: [{ a: "lista", texto: "Reparación terminada" }],
  lista: [
    {
      a: "entregada",
      texto: "Entregar al cliente",
      confirmar: "¿Confirmar que el equipo se entregó al cliente?",
    },
  ],
};

export function estaCerrada(estado) {
  return estado === "entregada" || SALIDAS.includes(estado);
}

// Hasta dónde llegó una orden en el camino normal. Las dos salidas solo se
// alcanzan desde una etapa concreta, así que se deduce de la tabla.
export function etapaAlcanzada(estado) {
  if (estado === "rechazada") {
    return "presupuestada";
  }
  if (estado === "cancelada") {
    return "solicitada";
  }
  return estado;
}

// El total no se guarda en ningún sitio: se calcula cada vez que se muestra.
export function totalPresupuesto(manoObra, piezas) {
  let total = Number(manoObra) || 0;
  for (const pieza of piezas || []) {
    total += (Number(pieza.cantidad) || 0) * (Number(pieza.precio) || 0);
  }
  return total;
}

export function dinero(valor) {
  return "$" + (Number(valor) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// PocketBase devuelve "2026-11-22 16:30:00.000Z" (con espacio en vez de T).
export function fecha(texto) {
  if (!texto) {
    return "";
  }
  return new Date(texto.replace(" ", "T")).toLocaleString("es", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nombreCliente(orden) {
  return orden.expand?.cliente?.nombre || "Cliente sin datos";
}

export function telefonoCliente(orden) {
  return orden.expand?.cliente?.telefono || "";
}

// Para el buscador: compara sin mayúsculas ni tildes.
export function normalizar(texto) {
  return (texto || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function coincide(orden, busqueda) {
  const buscado = normalizar(busqueda).trim();
  if (buscado === "") {
    return true;
  }
  const texto = normalizar(
    nombreCliente(orden) + " " + telefonoCliente(orden) + " " + orden.equipo + " " + orden.id,
  );
  return texto.includes(buscado);
}
