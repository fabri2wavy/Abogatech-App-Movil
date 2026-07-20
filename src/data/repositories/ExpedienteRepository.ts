import { supabase } from '../../lib/supabase';
import type { Expediente } from '../../domain/entities/Expediente';

/**
 * Repositorio que aísla la conexión con Supabase para la entidad Expediente.
 * Toda query a la tabla `expedientes` debe pasar por aquí.
 */
export async function getExpedientesPorAbogado(userId: string): Promise<Expediente[]> {
  // 1. Obtener el rol del usuario
  const { data: perfil, error: perfilError } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', userId)
    .single();

  if (perfilError) {
    console.error('ExpedienteRepository — Error al consultar perfil:', perfilError.message);
    throw perfilError;
  }

  // 2. Construir la consulta base
  let query = supabase
    .from('expedientes')
    .select(
      '*, cliente:perfiles!cliente_id(nombres, apellido_paterno, apellido_materno)'
    )
    .order('fecha_actualizacion', { ascending: false });

  // 3. Aplicar filtro solo si NO es administrador
  if (perfil?.rol !== 'admin') {
    query = query.eq('abogado_asignado_id', userId);
  }

  // 4. Ejecutar la consulta
  const { data, error } = await query;

  console.log('--- DEBUG SUPABASE ---');
  console.log('UserID consultado:', userId);
  console.log('Rol detectado:', perfil?.rol);
  console.log('Cantidad de expedientes encontrados:', data?.length);

  if (error) {
    console.error('ExpedienteRepository — Error al consultar:', error.message);
    throw error;
  }

  return (data as Expediente[]) ?? [];
}
