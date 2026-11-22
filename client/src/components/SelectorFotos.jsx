import { useEffect, useRef, useState } from "react";

const MAXIMO = 3;

// Elige hasta 3 imágenes y las previsualiza. La lista de archivos vive en el
// padre (fotos) y aquí solo se avisa de los cambios con alCambiar.
export default function SelectorFotos({ fotos, alCambiar }) {
  const entrada = useRef(null);
  const [previas, setPrevias] = useState([]);
  const [aviso, setAviso] = useState("");

  // Las vistas previas son URL temporales que crea el navegador y que hay
  // que liberar: eso es sincronizar con algo externo a React, con limpieza.
  useEffect(() => {
    const urls = fotos.map((foto) => URL.createObjectURL(foto));
    setPrevias(urls);
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [fotos]);

  function agregar(evento) {
    const elegidas = Array.from(evento.target.files).filter((archivo) =>
      archivo.type.startsWith("image/"),
    );
    const todas = [...fotos, ...elegidas];
    setAviso(todas.length > MAXIMO ? "Solo se guardan " + MAXIMO + " fotos por orden." : "");
    alCambiar(todas.slice(0, MAXIMO));
    // Un input de archivos no se puede controlar con value: se vacía a mano
    // para poder volver a elegir el mismo archivo.
    entrada.current.value = "";
  }

  function quitar(indice) {
    setAviso("");
    alCambiar(fotos.filter((foto, i) => i !== indice));
  }

  return (
    <div className="selector-fotos">
      <input
        ref={entrada}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={agregar}
      />
      <div className="fotos">
        {fotos.map((foto, indice) => (
          <figure key={foto.name + foto.lastModified}>
            {previas[indice] && <img src={previas[indice]} alt={foto.name} />}
            <button type="button" onClick={() => quitar(indice)} aria-label={"Quitar " + foto.name}>
              ×
            </button>
          </figure>
        ))}
        {fotos.length < MAXIMO && (
          <button type="button" className="agregar-foto" onClick={() => entrada.current.click()}>
            + Foto
          </button>
        )}
      </div>
      <p className="tenue">
        {fotos.length} de {MAXIMO} fotos. {aviso}
      </p>
    </div>
  );
}
