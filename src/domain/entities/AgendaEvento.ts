export interface AgendaEvento {
  id: string;
  titulo: string;
  descripcion?: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  tipo_evento: string;
  estado: string;
  expediente_id?: string | null;
  asignado_a: string;
  creado_por: string;
  creado_en?: string;
}
