import { Route, Routes } from "react-router";
import Barra from "./layouts/Barra.jsx";
import Tablero from "./pages/Tablero.jsx";
import PanelOrden from "./pages/PanelOrden.jsx";
import Recibir from "./pages/Recibir.jsx";
import Consulta from "./pages/Consulta.jsx";
import NoEncontrada from "./pages/NoEncontrada.jsx";

// Dos niveles de diseño anidado:
//   Barra   -> barra superior fija; debajo, la página activa (Outlet).
//   Tablero -> el tablero se queda a la vista y la orden elegida se abre
//              en un panel lateral, que es su propio Outlet (/orden/:id).
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Barra />}>
        <Route element={<Tablero />}>
          <Route index element={null} />
          <Route path="orden/:id" element={<PanelOrden />} />
        </Route>
        <Route path="recibir" element={<Recibir />} />
        <Route path="consulta" element={<Consulta />} />
        <Route path="*" element={<NoEncontrada />} />
      </Route>
    </Routes>
  );
}
