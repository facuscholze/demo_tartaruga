import { notFound } from "next/navigation";

/**
 * Cualquier ruta desconocida cae en el 404 con la tortuga varada. Sin esto,
 * Next responde con su 404 crudo (que además no tiene el cielo del sitio).
 */
export default function CatchAll() {
  notFound();
}
