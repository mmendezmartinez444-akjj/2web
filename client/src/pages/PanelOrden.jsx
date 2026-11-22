import { useOutletContext, useParams } from "react-router";
import FichaOrden from "../components/FichaOrden.jsx";

// Ruta /orden/:id. Lee el id de la URL y se lo pasa a la ficha.
// La key hace que, al saltar de una orden a otra, React monte una ficha
// nueva en vez de reutilizar la anterior con datos de otra orden.
export default function PanelOrden() {
  const { id } = useParams();
  const { alCambiar } = useOutletContext();

  return <FichaOrden key={id} id={id} alCambiar={alCambiar} />;
}
