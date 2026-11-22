import { urlFoto } from "../api.js";

// Fotos guardadas de una orden. Cada miniatura abre la imagen completa.
export default function Fotos({ orden }) {
  const fotos = orden.fotos || [];
  if (fotos.length === 0) {
    return <p className="tenue">Sin fotos.</p>;
  }
  return (
    <div className="fotos">
      {fotos.map((nombre) => (
        <a key={nombre} href={urlFoto(orden, nombre)} target="_blank" rel="noreferrer">
          <img src={urlFoto(orden, nombre)} alt={"Foto de " + orden.equipo} />
        </a>
      ))}
    </div>
  );
}
