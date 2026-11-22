import { NOMBRES } from "../taller.js";

// Etiqueta de color con el nombre de la etapa.
export default function Insignia({ estado }) {
  return <span className={"insignia insignia-" + estado}>{NOMBRES[estado] || estado}</span>;
}
