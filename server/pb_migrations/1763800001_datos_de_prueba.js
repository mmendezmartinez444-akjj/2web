/// <reference path="../pb_data/types.d.ts" />

// Datos de prueba: 2 clientes y 4 órdenes en etapas distintas, cada una con
// el historial que le corresponde. Se cargan solos la primera vez que arranca
// el servidor, así el proyecto se puede probar en una máquina limpia.
migrate((app) => {
  const clientes = app.findCollectionByNameOrId("clientes")
  const ordenes = app.findCollectionByNameOrId("ordenes")
  const eventos = app.findCollectionByNameOrId("eventos")

  function crearCliente(nombre, telefono) {
    const cliente = new Record(clientes)
    cliente.set("nombre", nombre)
    cliente.set("telefono", telefono)
    app.save(cliente)
    return cliente
  }

  // "recorrido" es la lista de etapas por las que ya pasó la orden.
  function crearOrden(datos, recorrido) {
    const orden = new Record(ordenes)
    orden.set("cliente", datos.cliente.id)
    orden.set("equipo", datos.equipo)
    orden.set("problema", datos.problema)
    orden.set("estado", recorrido[recorrido.length - 1])
    orden.set("diagnostico", datos.diagnostico || "")
    orden.set("manoObra", datos.manoObra || 0)
    orden.set("piezas", datos.piezas || [])
    app.save(orden)

    for (let i = 1; i < recorrido.length; i++) {
      const evento = new Record(eventos)
      evento.set("orden", orden.id)
      evento.set("de", recorrido[i - 1])
      evento.set("a", recorrido[i])
      app.save(evento)
    }
  }

  const ana = crearCliente("Ana Pérez", "5551-2345")
  const luis = crearCliente("Luis Hernández", "5559-8760")

  crearOrden(
    {
      cliente: ana,
      equipo: "Laptop Lenovo IdeaPad 3",
      problema: "No enciende. Se apagó de golpe mientras cargaba.",
    },
    ["solicitada"],
  )

  crearOrden(
    {
      cliente: luis,
      equipo: "Teléfono Samsung Galaxy A52",
      problema: "Pantalla rota tras una caída. El táctil responde a ratos.",
      diagnostico: "Pantalla y marco dañados. La placa y la batería están bien.",
      manoObra: 1500,
      piezas: [
        { descripcion: "Pantalla AMOLED con marco", cantidad: 1, precio: 9500 },
        { descripcion: "Adhesivo de tapa trasera", cantidad: 1, precio: 300 },
      ],
    },
    ["solicitada", "en_diagnostico", "presupuestada"],
  )

  crearOrden(
    {
      cliente: ana,
      equipo: 'Televisor LG 43"',
      problema: "Se escucha el sonido pero la pantalla se queda negra.",
      diagnostico: "Tiras LED de retroiluminación quemadas.",
      manoObra: 2500,
      piezas: [{ descripcion: "Tira LED de retroiluminación", cantidad: 3, precio: 1200 }],
    },
    ["solicitada", "en_diagnostico", "presupuestada", "aprobada", "en_reparacion"],
  )

  crearOrden(
    {
      cliente: luis,
      equipo: "Laptop HP Pavilion 15",
      problema: "Se calienta mucho y se apaga sola.",
      diagnostico: "Ventilador obstruido y pasta térmica seca.",
      manoObra: 1800,
      piezas: [{ descripcion: "Pasta térmica", cantidad: 1, precio: 400 }],
    },
    [
      "solicitada",
      "en_diagnostico",
      "presupuestada",
      "aprobada",
      "en_reparacion",
      "lista",
      "entregada",
    ],
  )
}, (app) => {
  // Sin vuelta atrás: al revertir la migración anterior se borran las
  // colecciones completas, con estos datos dentro.
})
