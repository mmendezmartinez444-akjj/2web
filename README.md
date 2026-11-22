# Taller — gestión de órdenes de reparación 

Aplicación para un taller que repara teléfonos, laptops y televisores. Sustituye la libreta: registra los equipos que llegan, sigue cada orden por sus etapas, guarda el presupuesto y deja un historial de todo lo que pasó.

- **Interfaz:** React (Vite, JavaScript) con React Router. Las peticiones se hacen con `fetch`.
- **Servidor:** PocketBase. El esquema está en `server/pb_migrations` y la lógica en `server/pb_hooks`.
- Sin autenticación, usuarios ni roles: el único usuario es el personal del taller.

## La interfaz

Un tablero con una columna por etapa. La orden elegida se abre en un panel lateral sin salir del tablero.

| Ruta | Página |
| --- | --- |
| `/` | Tablero: una columna por etapa |
| `/orden/:id` | El mismo tablero con el panel de la orden abierto |
| `/recibir` | Recepción de un equipo en tres pasos, con fotos |
| `/consulta` | Buscador para atender el teléfono |
| cualquier otra | Página no encontrada |

## Requisitos

- **Node.js 20 o superior** (con npm).
- **PocketBase 0.23 o superior.** Las migraciones y los hooks usan la API de JavaScript de esas versiones.

## Cómo arrancarlo desde cero

### 1. Servidor

1. Descarga PocketBase para tu sistema desde <https://pocketbase.io/docs/> y descomprime el archivo.
2. Copia el ejecutable (`pocketbase` o `pocketbase.exe`) dentro de la carpeta `server/`, junto a `pb_migrations` y `pb_hooks`.
3. Arranca el servidor:

   ```bash
   cd server
   ./pocketbase serve        # en Windows: pocketbase.exe serve
   ```

La primera vez, PocketBase crea `server/pb_data`, aplica las migraciones (colecciones, reglas y datos de prueba) y carga los hooks. No hay que crear nada a mano. El servidor queda en `http://127.0.0.1:8090`.

En ese primer arranque la consola muestra un enlace para crear un superusuario del panel de administración (`http://127.0.0.1:8090/_/`). Es opcional: la aplicación no lo necesita.

### 2. Interfaz

En otra terminal:

```bash
cd client
npm install
npm run dev
```

Abre la dirección que muestra Vite (normalmente `http://localhost:5173`).

Si el servidor está en otra dirección, copia `client/.env.example` como `client/.env` y cambia `VITE_PB_URL`.

### 3. Empezar de cero otra vez

Detén el servidor, borra la carpeta `server/pb_data` y vuelve a arrancarlo. Las migraciones recrean todo.

## Datos de prueba

Los carga la migración `1763800001_datos_de_prueba.js`:

| Cliente | Teléfono |
| --- | --- |
| Ana Pérez | 5551-2345 |
| Luis Hernández | 5559-8760 |

| Equipo | Cliente | Etapa |
| --- | --- | --- |
| Laptop Lenovo IdeaPad 3 | Ana Pérez | solicitada |
| Teléfono Samsung Galaxy A52 | Luis Hernández | presupuestada |
| Televisor LG 43" | Ana Pérez | en_reparacion |
| Laptop HP Pavilion 15 | Luis Hernández | entregada |

Cada orden tiene los eventos que corresponden a las etapas por las que pasó.

## Comprobar las garantías del servidor

Con el servidor encendido:

```bash
cd server
node pruebas/garantias.mjs
```

El script habla directamente con la API, sin pasar por la interfaz, e intenta todo lo que no debe ocurrir: saltarse etapas, crear una orden ya entregada, cambiar un presupuesto, editar o borrar eventos, borrar órdenes… Imprime `ok` o `FALLO` en cada comprobación. Deja en la base de datos un cliente y tres órdenes de prueba.

## Modelo de datos

| Colección | Campos |
| --- | --- |
| `clientes` | `nombre` (texto), `telefono` (texto) |
| `ordenes` | `cliente` (relación a clientes, requerida), `equipo` (texto), `problema` (texto), `estado` (select), `diagnostico` (texto), `manoObra` (número), `piezas` (json: lista de `{ descripcion, cantidad, precio }`), `fotos` (archivos, hasta 3 imágenes) |
| `eventos` | `orden` (relación a ordenes), `de` (texto), `a` (texto), `created` (fecha automática) |

`clientes` y `ordenes` tienen además `created` y `updated` automáticos. El total del presupuesto no se guarda: se calcula al mostrarlo.

## Qué garantiza el servidor y dónde

| Garantía | Dónde se cumple |
| --- | --- |
| Las órdenes no se borran | Regla `deleteRule: null` en `ordenes` |
| Los eventos no se editan ni se borran | Reglas `updateRule: null` y `deleteRule: null` en `eventos` |
| Nadie inventa eventos por la API | Regla `createRule: null` en `eventos`; los escribe el servidor |
| Los clientes no se editan ni se borran | Reglas `updateRule: null` y `deleteRule: null` en `clientes` |
| Una orden nace `solicitada` y sin presupuesto | Hook `onRecordCreateRequest` |
| Solo los cambios de etapa de la tabla, sin saltos | Hook `onRecordUpdateRequest` + `reglas.js` |
| Una orden rechazada, cancelada o entregada no cambia | Hook `onRecordUpdateRequest` + `reglas.js` |
| El presupuesto se escribe una vez, al presupuestar | Hook `onRecordUpdateRequest` + `reglas.js` |
| Cada cambio de etapa deja un evento con su fecha | Hook `onRecordUpdateExecute` |

Además hay una ruta propia, `GET /api/resumen`, que devuelve cuántas órdenes hay en cada etapa.

## Estructura

```
server/
  pb_migrations/
    1763800000_crear_colecciones.js   esquema y reglas de acceso
    1763800001_datos_de_prueba.js     2 clientes y 4 órdenes
  pb_hooks/
    reglas.js                         tabla de cambios de etapa y validaciones
    ordenes.pb.js                     hooks de crear, actualizar e historial
    resumen.pb.js                     ruta GET /api/resumen
  pruebas/garantias.mjs               comprobación de las garantías
client/
  src/
    main.jsx, App.jsx                 arranque y rutas
    api.js                            todas las peticiones (fetch)
    taller.js                         etapas, acciones, total, formatos
    layouts/Barra.jsx                 barra superior + Outlet
    pages/                            Tablero (con su propio Outlet), PanelOrden, Recibir, Consulta, NoEncontrada
    components/                       piezas pequeñas reutilizables
    estilos.css
```
