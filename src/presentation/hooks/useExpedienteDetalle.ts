import { useState, useEffect } from 'react';
import { ExpedienteDetalleRepository } from '../../data/repositories/ExpedienteDetalleRepository';

// Mock Data
export const mockExpedienteDetalles = {
  documentos: [
    { id: '1', nombre: 'Demanda_Inicial.pdf', tipo: 'PDF', fecha: '12 May 2026', size: '2.4 MB' },
    { id: '2', nombre: 'Poder_Notarial.pdf', tipo: 'PDF', fecha: '15 May 2026', size: '1.1 MB' },
    { id: '3', nombre: 'Pruebas_Documentales.docx', tipo: 'DOCX', fecha: '20 May 2026', size: '4.5 MB' },
  ],
  bitacora: [
    { id: '1', contenido: 'Se presentaron los folders en jurisdicción.', fecha: '22 May 2026', visible_cliente: true, creado_por_nombre: 'Martin Iturri' },
    { id: '2', contenido: 'Audiencia programada, el cliente debe llevar su CI original.', fecha: '24 May 2026', visible_cliente: true, creado_por_nombre: 'Martin Iturri' },
  ],
  avances: [
    { id: '1', titulo: 'Caso Aperturado', fecha: '10 May 2026', estado: 'completado', detalle: 'Se recibió toda la documentación inicial.' },
    { id: '2', titulo: 'Presentación de Demanda', fecha: '12 May 2026', estado: 'completado', detalle: 'Demanda ingresada en plataforma SIREJ.' },
    { id: '3', titulo: 'Auto de Admisión', fecha: '18 May 2026', estado: 'completado', detalle: 'El juez admitió la demanda.' },
    { id: '4', titulo: 'Notificación a contraparte', fecha: 'Pendiente', estado: 'pendiente', detalle: 'A la espera del oficial de diligencias.' },
  ],
  gastos_operativos: [
    { id: '1', concepto: 'Fotocopias legalizadas', monto: 150, fecha: '10 May 2026', reembolsado: true, observaciones: '3 copias del poder.' },
    { id: '2', concepto: 'Transporte al juzgado', monto: 40, fecha: '20 May 2026', reembolsado: false, observaciones: 'Taxi ida y vuelta.' },
  ]
};

export const useExpedienteDetalle = (id: string | string[] | undefined) => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  const fetchDetalles = async () => {
    if (!id) return;
    try {
      setIsLoading(true);
      const expedienteId = Array.isArray(id) ? id[0] : id;
      
      const [bitacora, gastos, documentos] = await Promise.all([
        ExpedienteDetalleRepository.getBitacora(expedienteId),
        ExpedienteDetalleRepository.getGastosOperativos(expedienteId),
        ExpedienteDetalleRepository.getDocumentos(expedienteId)
      ]);

      // Combinamos con mocks para las pestañas aún no implementadas en BD
      setData({
        ...mockExpedienteDetalles,
        bitacora,
        gastos_operativos: gastos,
        documentos: documentos.length > 0 ? documentos : mockExpedienteDetalles.documentos // Fallback to mock if empty for visual
      });
    } catch (error) {
      console.error('Error fetching expediente details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetalles();
  }, [id]);

  const agregarNota = async (contenido: string) => {
    const expedienteId = Array.isArray(id) ? id[0] : id;
    if (!expedienteId) return;
    
    const nuevaNota = await ExpedienteDetalleRepository.crearNotaBitacora(expedienteId, contenido);
    setData((prev: any) => ({
      ...prev,
      bitacora: [nuevaNota, ...prev.bitacora]
    }));
  };

  const agregarGasto = async (gasto: any) => {
    const expedienteId = Array.isArray(id) ? id[0] : id;
    if (!expedienteId) return;
    
    const nuevoGasto = await ExpedienteDetalleRepository.crearGastoOperativo({
      ...gasto,
      expediente_id: expedienteId
    });
    
    setData((prev: any) => ({
      ...prev,
      gastos_operativos: [nuevoGasto, ...prev.gastos_operativos].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    }));
  };

  const agregarDocumento = async (imageUri: string) => {
    const expedienteId = Array.isArray(id) ? id[0] : id;
    if (!expedienteId) return;

    const nuevoDoc = await ExpedienteDetalleRepository.subirDocumento(expedienteId, imageUri);

    setData((prev: any) => ({
      ...prev,
      documentos: [nuevoDoc, ...prev.documentos]
    }));
  };

  return { data, isLoading, agregarNota, agregarGasto, agregarDocumento, refetch: fetchDetalles };
};
