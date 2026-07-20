import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import type { Juzgado } from '../../domain/entities/Juzgado';

export function useJuzgados() {
  const [juzgados, setJuzgados] = useState<Juzgado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJuzgados = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { data, error: sbError } = await supabase
        .from('juzgados')
        .select('*')
        .order('nombre', { ascending: true });

      if (sbError) {
        throw new Error(sbError.message);
      }

      setJuzgados((data as Juzgado[]) || []);
    } catch (err: any) {
      console.error('useJuzgados — Error:', err);
      setError(err.message || 'Error al cargar los juzgados');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJuzgados();
  }, [fetchJuzgados]);

  return {
    juzgados,
    isLoading,
    error,
    refetch: fetchJuzgados,
  };
}
