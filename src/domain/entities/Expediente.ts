// ─── Estados del expediente ─────────────────────────────────────
export type EstadoExpediente = 'activo' | 'en_espera' | 'cerrado' | 'en_tramite' | 'archivado';

// ─── Cliente (viene del join con la tabla perfiles) ─────────────
export interface ClientePerfil {
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  telefono?: string;
}

// ─── Expediente (esquema real de Supabase) ──────────────────────
export interface Expediente {
  id: string;
  numero_caso?: string;
  titulo: string;
  materia?: string;
  juzgado: string;
  nurej?: string;
  estado: string;
  fecha_actualizacion: string;
  abogado_asignado_id: string;
  cliente: ClientePerfil | null;
}

/**
 * Concatena nombres + apellido_paterno + apellido_materno del cliente.
 * Retorna null si no hay cliente asociado.
 */
export function getNombreCompletoCliente(cliente: ClientePerfil | null): string | null {
  if (!cliente) return null;
  return [cliente.nombres, cliente.apellido_paterno, cliente.apellido_materno]
    .filter(Boolean)
    .join(' ')
    .trim();
}
