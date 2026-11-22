import { Link } from "react-router";

export default function NoEncontrada() {
  return (
    <main className="pagina">
      <h1>404 · Página no encontrada</h1>
      <p className="tenue">La dirección que abriste no existe en esta aplicación.</p>
      <Link className="boton boton-principal" to="/">
        Ir al tablero
      </Link>
    </main>
  );
}
