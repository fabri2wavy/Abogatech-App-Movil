import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { AgendaEvento } from '../../domain/entities/AgendaEvento';
import { getAgendaHoyPorAbogado, crearEventoAgenda } from '../../data/repositories/AgendaRepository';

export function useAgendaHoy() {
  const [eventos, setEventos] = useState<AgendaEvento[]>([]);
  const [expedientesDisponibles, setExpedientesDisponibles] = useState<{id: string, numero_caso: string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAgenda = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const data = await getAgendaHoyPorAbogado(session.user.id);
      setEventos(data);
      
      // Load Expedientes
      const { data: expData, error: expError } = await supabase
        .from('expedientes')
        .select('id, numero_caso');
        
      if (!expError && expData) {
        setExpedientesDisponibles(expData);
      }
    } catch (err) {
      console.error('useAgendaHoy — Error:', err);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchAgenda();
      setIsLoading(false);
    };
    load();
  }, [fetchAgenda]);

  const agregarEvento = async (payload: Omit<AgendaEvento, 'id'>) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return null;

      const dbPayload = {
        ...payload,
        // Ensure default IDs are injected if missing, though HomeScreen will pass them
        creado_por: session.user.id,
        asignado_a: payload.asignado_a || session.user.id,
      };

      const creado = await crearEventoAgenda(dbPayload as any);
      
      if (creado) {
        setEventos((prev) => [...prev, creado]);
        return creado;
      }
    } catch (err) {
      console.error('useAgendaHoy — Error al agregar evento:', err);
      throw err;
    }
    return null;
  };

  return {
    eventos,
    expedientesDisponibles,
    isLoading,
    fetchAgenda,
    agregarEvento,
  };
}
