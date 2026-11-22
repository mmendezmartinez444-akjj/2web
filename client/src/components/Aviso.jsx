// Mensaje de error. Si no hay texto, no pinta nada.
export default function Aviso({ texto }) {
  if (!texto) {
    return null;
  }
  return (
    <p className="aviso" role="alert">
      {texto}
    </p>
  );
}
