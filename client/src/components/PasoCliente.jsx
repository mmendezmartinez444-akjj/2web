// Paso 1 de la recepción: elegir un cliente registrado o anotar uno nuevo.
// No guarda nada por su cuenta: los valores y sus "set" llegan del padre.
export default function PasoCliente({ clientes, cliente, alCambiar }) {
  function cambiar(campo, valor) {
    alCambiar({ ...cliente, [campo]: valor });
  }

  return (
    <div className="formulario">
      <div className="opciones">
        <label>
          <input
            type="radio"
            name="tipoCliente"
            checked={!cliente.esNuevo}
            disabled={clientes.length === 0}
            onChange={() => cambiar("esNuevo", false)}
          />
          Ya registrado
        </label>
        <label>
          <input
            type="radio"
            name="tipoCliente"
            checked={cliente.esNuevo}
            onChange={() => cambiar("esNuevo", true)}
          />
          Cliente nuevo
        </label>
      </div>

      {cliente.esNuevo ? (
        <>
          <label>
            Nombre
            <input
              type="text"
              value={cliente.nombre}
              onChange={(evento) => cambiar("nombre", evento.target.value)}
            />
          </label>
          <label>
            Teléfono
            <input
              type="tel"
              value={cliente.telefono}
              onChange={(evento) => cambiar("telefono", evento.target.value)}
            />
          </label>
        </>
      ) : (
        <label>
          Cliente
          <select value={cliente.id} onChange={(evento) => cambiar("id", evento.target.value)}>
            <option value="">Elegir…</option>
            {clientes.map((registrado) => (
              <option key={registrado.id} value={registrado.id}>
                {registrado.nombre} — {registrado.telefono}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
