import { dinero, totalPresupuesto } from "../taller.js";

// Muestra un presupuesto ya registrado. El total se calcula aquí mismo.
export default function Presupuesto({ diagnostico, manoObra, piezas }) {
  const lista = piezas || [];

  return (
    <div className="presupuesto">
      <p className="diagnostico">{diagnostico}</p>
      <table>
        <thead>
          <tr>
            <th>Concepto</th>
            <th className="num">Cant.</th>
            <th className="num">Precio</th>
            <th className="num">Importe</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Mano de obra</td>
            <td className="num"></td>
            <td className="num"></td>
            <td className="num">{dinero(manoObra)}</td>
          </tr>
          {lista.map((pieza, indice) => (
            // Un presupuesto guardado no cambia, así que el índice sirve de key.
            <tr key={indice}>
              <td>{pieza.descripcion}</td>
              <td className="num">{pieza.cantidad}</td>
              <td className="num">{dinero(pieza.precio)}</td>
              <td className="num">{dinero(pieza.cantidad * pieza.precio)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan="3">Total</td>
            <td className="num">{dinero(totalPresupuesto(manoObra, lista))}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
