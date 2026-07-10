import { useCallback, useEffect, useState } from 'react';

import { supabase } from '../../lib/supabase';
import type { Expediente } from '../../domain/entities/Expediente';
import { getExpedientesPorAbogado } from '../../data/repositories/ExpedienteRepository';

/**
 * Hook que orquesta la carga de expedientes del abogado logueado.
 * Retorna los datos, estados de carga, y funciones para refrescar.
 */
export function useExpedientes() {
  const [casos, setCasos] = useState<Expediente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchExpedientes = useCallback(async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) return;

      const data = await getExpedientesPorAbogado(session.user.id);
      setCasos(data);
    } catch (err) {
      console.error('useExpedientes — Error:', err);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchExpedientes();
      setIsLoading(false);
    };
    load();
  }, [fetchExpedientes]);

  // Pull-to-refresh
  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchExpedientes();
    setIsRefreshing(false);
  }, [fetchExpedientes]);

  return {
    casos,
    isLoading,
    isRefreshing,
    onRefresh,
    fetchExpedientes,
  };
}
