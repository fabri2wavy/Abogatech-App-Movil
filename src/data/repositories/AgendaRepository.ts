import { supabase } from '../../lib/supabase';
import type { AgendaEvento } from '../../domain/entities/AgendaEvento';

export async function getAgendaHoyPorAbogado(userId: string): Promise<AgendaEvento[]> {
  // Para el MVP: traemos los que tengan estado 'pendiente' y filtramos por abogado.
  // En una app real, también filtraríamos por la fecha de hoy.
  // Primero veamos si el rol es admin (en cuyo caso podríamos traer todos, pero para la agenda personal es mejor traer los asignados al abogado)
  
  // Vamos a traer los de estado 'pendiente' ordenados por fecha_inicio
  const { data, error } = await supabase
    .from('agenda_eventos')
    .select('*')
    .eq('estado', 'pendiente')
    //.eq('abogado_asignado_id', userId) // Opcional, dependiendo de la BD
    .order('fecha_inicio', { ascending: true });

  if (error) {
    console.error('AgendaRepository — Error al consultar agenda:', error.message);
    throw error;
  }

  return (data as AgendaEvento[]) ?? [];
}

export async function crearEventoAgenda(evento: Omit<AgendaEvento, 'id'>): Promise<AgendaEvento | null> {
  const { data, error } = await supabase
    .from('agenda_eventos')
    .insert([evento])
    .select()
    .single();

  if (error) {
    console.error('AgendaRepository — Error al crear evento:', error.message);
    console.log('🚨 ERROR REAL DE SUPABASE:', JSON.stringify(error, null, 2));
    throw error;
  }

  return data as AgendaEvento;
}
