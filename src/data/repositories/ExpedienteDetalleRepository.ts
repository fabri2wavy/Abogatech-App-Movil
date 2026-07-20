import { supabase } from '../../lib/supabase';

export class ExpedienteDetalleRepository {
  
  static async getBitacora(expedienteId: string) {
    const { data, error } = await supabase
      .from('bitacora')
      .select(`
        id,
        contenido,
        fecha:creado_en,
        visible_cliente,
        perfiles!creado_por (nombres, apellido_paterno)
      `)
      .eq('expediente_id', expedienteId)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    
    return data.map((nota: any) => ({
      id: nota.id,
      contenido: nota.contenido,
      // Formateamos fecha simple por ahora
      fecha: new Date(nota.fecha).toLocaleDateString(),
      visible_cliente: nota.visible_cliente,
      creado_por_nombre: nota.perfiles ? `${nota.perfiles.nombres} ${nota.perfiles.apellido_paterno}` : 'Desconocido'
    }));
  }

  static async getGastosOperativos(expedienteId: string) {
    const { data, error } = await supabase
      .from('gastos_expediente')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('fecha', { ascending: false });

    if (error) throw error;
    
    return data.map((gasto: any) => ({
      id: gasto.id,
      concepto: gasto.concepto,
      monto: gasto.monto,
      fecha: gasto.fecha, // YYYY-MM-DD string
      reembolsado: gasto.reembolsado,
      observaciones: gasto.observaciones
    }));
  }

  static async getAvances(expedienteId: string) {
    // Para simplificar, usaremos los informes_avance o mocks si no hay datos.
    return [];
  }

  static async getDocumentos(expedienteId: string) {
    const { data, error } = await supabase
      .from('documentos')
      .select('*')
      .eq('expediente_id', expedienteId)
      .order('creado_en', { ascending: false });

    if (error) throw error;
    
    return data.map((doc: any) => ({
      id: doc.id,
      nombre: doc.nombre_archivo,
      tipo: doc.tipo_archivo,
      fecha: new Date(doc.creado_en).toLocaleDateString(),
      size: doc.tamano_bytes ? `${Math.round(doc.tamano_bytes / 1024)} KB` : 'Desconocido',
      ruta_storage: doc.ruta_storage
    }));
  }

  // --- Mutaciones ---

  static async crearNotaBitacora(expedienteId: string, contenido: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Debes iniciar sesión para realizar esta acción.");

    const { data, error } = await supabase
      .from('bitacora')
      .insert({
        expediente_id: expedienteId,
        contenido,
        visible_cliente: true,
        creado_por: user.id
      })
      .select(`
        id,
        contenido,
        fecha:creado_en,
        visible_cliente,
        perfiles!creado_por (nombres, apellido_paterno)
      `)
      .single();

    if (error) throw error;

    return {
      id: data.id,
      contenido: data.contenido,
      fecha: new Date(data.fecha).toLocaleDateString(),
      visible_cliente: data.visible_cliente,
      creado_por_nombre: data.perfiles ? `${(data.perfiles as any).nombres} ${(data.perfiles as any).apellido_paterno}` : 'Tú'
    };
  }

  static async crearGastoOperativo(gasto: {
    expediente_id: string;
    concepto: string;
    monto: number;
    fecha: string;
    reembolsado: boolean;
    observaciones: string;
  }) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Debes iniciar sesión para realizar esta acción.");

    const { data, error } = await supabase
      .from('gastos_expediente')
      .insert({
        ...gasto,
        creado_por: user.id
      })
      .select()
      .single();

    if (error) throw error;

    return data;
  }

  static async subirDocumento(expedienteId: string, imageUri: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Debes iniciar sesión para subir documentos.");

    // En Expo moderno, podemos obtener el Blob usando fetch directamente de la URI
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    const fileExt = imageUri.split('.').pop() || 'jpg';
    const fileName = `${expedienteId}/${Date.now()}.${fileExt}`;
    
    // Subir a Storage en bucket "documentos"
    const { data: storageData, error: storageError } = await supabase.storage
      .from('documentos')
      .upload(fileName, blob, {
        contentType: `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`
      });

    if (storageError) throw storageError;

    // Registrar en tabla documentos
    const { data, error } = await supabase
      .from('documentos')
      .insert({
        expediente_id: expedienteId,
        nombre_archivo: `Captura-${new Date().toLocaleDateString().replace(/\//g, '-')}.${fileExt}`,
        ruta_storage: storageData.path,
        tipo_archivo: fileExt.toUpperCase(),
        tamano_bytes: blob.size,
        subido_por: user.id
      })
      .select()
      .single();

    if (error) throw error;
    
    return {
      id: data.id,
      nombre: data.nombre_archivo,
      tipo: data.tipo_archivo,
      fecha: new Date(data.creado_en).toLocaleDateString(),
      size: data.tamano_bytes ? `${Math.round(data.tamano_bytes / 1024)} KB` : 'Desconocido',
      ruta_storage: data.ruta_storage
    };
  }
}
