/// <reference path="../pb_data/types.d.ts" />

// Esquema del taller: clientes, ordenes y eventos.
//
// Reglas de acceso (no hay autenticación, así que no distinguen quién pide):
//   ""   -> cualquiera puede hacer la acción
//   null -> nadie puede por la API (solo un superusuario desde el panel)
// Lo que nunca debe ocurrir queda en null. Lo que depende del contenido de
// la petición (por ejemplo, qué cambio de etapa es válido) lo validan los hooks.
migrate((app) => {
  const clientes = new Collection({
    type: "base",
    name: "clientes",
    listRule: "",
    viewRule: "",
    createRule: "",
    updateRule: null,
    deleteRule: null,
    fields: [
      { name: "nombre", type: "text", required: true, max: 120 },
      { name: "telefono", type: "text", required: true, max: 40 },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  })
  app.save(clientes)

  const ordenes = new Collection({
    type: "base",
    name: "ordenes",
    listRule: "",
    viewRule: "",
    createRule: "", // el hook obliga a que nazca "solicitada"
    updateRule: "", // el hook solo deja pasar cambios de etapa válidos
    deleteRule: null, // las órdenes no se borran
    fields: [
      {
        name: "cliente",
        type: "relation",
        required: true,
        collectionId: clientes.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "equipo", type: "text", required: true, max: 200 },
      { name: "problema", type: "text", required: true, max: 2000 },
      {
        name: "estado",
        type: "select",
        required: true,
        maxSelect: 1,
        values: [
          "solicitada",
          "en_diagnostico",
          "presupuestada",
          "aprobada",
          "rechazada",
          "en_reparacion",
          "lista",
          "entregada",
          "cancelada",
        ],
      },
      { name: "diagnostico", type: "text", max: 2000 },
      { name: "manoObra", type: "number", min: 0 },
      { name: "piezas", type: "json" },
      {
        name: "fotos",
        type: "file",
        maxSelect: 3,
        maxSize: 5242880, // 5 MB por foto
        mimeTypes: ["image/jpeg", "image/png", "image/webp", "image/gif"],
      },
      { name: "created", type: "autodate", onCreate: true },
      { name: "updated", type: "autodate", onCreate: true, onUpdate: true },
    ],
  })
  app.save(ordenes)

  const eventos = new Collection({
    type: "base",
    name: "eventos",
    listRule: "",
    viewRule: "",
    createRule: null, // solo los escribe el servidor (hook de ordenes)
    updateRule: null, // nadie los edita
    deleteRule: null, // nadie los borra
    fields: [
      {
        name: "orden",
        type: "relation",
        required: true,
        collectionId: ordenes.id,
        maxSelect: 1,
        cascadeDelete: false,
      },
      { name: "de", type: "text", required: true },
      { name: "a", type: "text", required: true },
      { name: "created", type: "autodate", onCreate: true },
    ],
  })
  app.save(eventos)
}, (app) => {
  // Se borran en orden inverso por las relaciones.
  app.delete(app.findCollectionByNameOrId("eventos"))
  app.delete(app.findCollectionByNameOrId("ordenes"))
  app.delete(app.findCollectionByNameOrId("clientes"))
})
