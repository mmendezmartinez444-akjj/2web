// Paso 2 de la recepción: qué equipo es y qué le pasa.
export default function PasoEquipo({ equipo, problema, alCambiarEquipo, alCambiarProblema }) {
  return (
    <div className="formulario">
      <label>
        Equipo
        <input
          type="text"
          placeholder="Marca y modelo"
          value={equipo}
          onChange={(evento) => alCambiarEquipo(evento.target.value)}
        />
      </label>
      <label>
        Problema que describe el cliente
        <textarea
          rows="5"
          value={problema}
          onChange={(evento) => alCambiarProblema(evento.target.value)}
        />
      </label>
    </div>
  );
}
