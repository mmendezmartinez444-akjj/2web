import { NavLink, Outlet } from "react-router";

// Diseño común: barra superior con la navegación y, debajo, la página activa.
export default function Barra() {
  return (
    <div className="app">
      <header className="barra">
        <p className="marca">TALLER</p>
        <nav>
          <NavLink to="/" end>
            Tablero
          </NavLink>
          <NavLink to="/consulta">Consulta</NavLink>
        </nav>
        <NavLink to="/recibir" className="boton boton-principal">
          + Recibir equipo
        </NavLink>
      </header>
      <Outlet />
    </div>
  );
}
