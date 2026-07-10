import { supabase } from '../../lib/supabase';
import type { Expediente } from '../../domain/entities/Expediente';

/**
 * Repositorio que aísla la conexión con Supabase para la entidad Expediente.
 * Toda query a la tabla `expedientes` debe pasar por aquí.
 */
export async function getExpedientesPorAbogado(userId: string): Promise<Expediente[]> {
  const { data, error } = await supabase
    .from('expedientes')
    .select(
      '*, cliente:perfiles!cliente_id(nombres, apellido_paterno, apellido_materno)'
    )
    .eq('abogado_asignado_id', userId)
    .order('fecha_actualizacion', { ascending: false });

  if (error) {
    console.error('ExpedienteRepository — Error al consultar:', error.message);
    throw error;
  }

  return (data as Expediente[]) ?? [];
}
