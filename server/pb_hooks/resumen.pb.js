/// <reference path="../pb_data/types.d.ts" />

// Ruta propia: GET /api/resumen
// Devuelve cuántas órdenes hay en cada etapa, para la visión de conjunto.
// Ejemplo: { "total": 4, "porEstado": { "solicitada": 1, "lista": 0, ... } }
routerAdd("GET", "/api/resumen", (e) => {
  const reglas = require(`${__hooks}/reglas.js`)

  const porEstado = {}
  let total = 0

  for (let i = 0; i < reglas.ESTADOS.length; i++) {
    const estado = reglas.ESTADOS[i]
    const cantidad = e.app.countRecords("ordenes", $dbx.hashExp({ estado: estado }))
    porEstado[estado] = cantidad
    total += cantidad
  }

  return e.json(200, { total: total, porEstado: porEstado })
})
