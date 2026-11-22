/// <reference path="../pb_data/types.d.ts" />

// Hooks de la colección "ordenes".
// Las reglas de acceso solo pueden decir "permitido" o "bloqueado"; lo que
// depende del contenido de la petición se valida aquí, en el servidor.

// 1) Crear: toda orden nace "solicitada" y sin presupuesto.
onRecordCreateRequest((e) => {
  const reglas = require(`${__hooks}/reglas.js`)

  if (e.record.getString("estado") === "") {
    e.record.set("estado", "solicitada")
  }

  const error = reglas.errorCreacion(reglas.leerOrden(e.record))
  if (error) {
    throw new BadRequestError(error)
  }

  e.next()
}, "ordenes")

// 2) Actualizar: solo cambios de etapa de la tabla, sin saltos, y el
//    presupuesto solo se escribe al pasar a "presupuestada".
//    e.record trae ya los datos de la petición; original() es lo guardado.
onRecordUpdateRequest((e) => {
  const reglas = require(`${__hooks}/reglas.js`)

  const antes = reglas.leerOrden(e.record.original())
  const despues = reglas.leerOrden(e.record)

  const error = reglas.errorActualizacion(antes, despues)
  if (error) {
    throw new BadRequestError(error)
  }

  e.next()
}, "ordenes")

// 3) Historial: cada vez que una orden se guarda con otra etapa, el propio
//    servidor escribe el evento. Es un hook de modelo, así que se dispara
//    con cualquier guardado, no solo con los que llegan por la API.
onRecordUpdateExecute((e) => {
  const de = e.record.original().getString("estado")
  const a = e.record.getString("estado")

  e.next() // aquí se ejecuta el UPDATE de la orden

  if (de !== a) {
    const eventos = e.app.findCollectionByNameOrId("eventos")
    const evento = new Record(eventos)
    evento.set("orden", e.record.id)
    evento.set("de", de)
    evento.set("a", a)
    e.app.save(evento)
  }
}, "ordenes")
