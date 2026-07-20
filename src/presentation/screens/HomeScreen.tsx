import { Ionicons } from '@expo/vector-icons';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Location from 'expo-location';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const SCREEN_HEIGHT = Dimensions.get('window').height;

const TIPO_OPTIONS = [
  { label: '📋 Tarea', value: 'tarea' },
  { label: '🎙️ Audiencia', value: 'audiencia' },
  { label: '👥 Reunión', value: 'reunion' },
];

type CheckinStatus = 'idle' | 'loading' | 'success';
type AndroidPickerStep = 'date' | 'time';
type ActivePicker = 'inicio' | 'fin' | null;

import { useAgendaHoy } from '../hooks/useAgendaHoy';

function getAgendaIcon(tipo_evento?: string | null) {
  const normalizedTipo = tipo_evento?.toLowerCase() || '';
  if (normalizedTipo.includes('audiencia')) {
    return { name: 'mic-outline' as const, bg: 'bg-blue-50', color: '#2563EB' };
  } else if (normalizedTipo.includes('reunion')) {
    return { name: 'people-outline' as const, bg: 'bg-emerald-50', color: '#059669' };
  }
  return { name: 'document-text-outline' as const, bg: 'bg-amber-50', color: '#D97706' };
}

export default function HomeScreen() {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>('idle');
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [completadas, setCompletadas] = useState<string[]>([]);

  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newTipo, setNewTipo] = useState('tarea');
  const [newExpediente, setNewExpediente] = useState<string | null>(null);
  const [newFechaInicio, setNewFechaInicio] = useState(new Date());
  const [newFechaFin, setNewFechaFin] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [isAdding, setIsAdding] = useState(false);

  // iOS: mostramos el picker inline expandido debajo del campo
  const [expandedPicker, setExpandedPicker] = useState<'inicio' | 'fin' | null>(null);

  // Android: flujo dos pasos
  const [activePicker, setActivePicker] = useState<ActivePicker>(null);
  const [androidStep, setAndroidStep] = useState<AndroidPickerStep>('date');
  const [androidTempDate, setAndroidTempDate] = useState<Date>(new Date());

  const { eventos, expedientesDisponibles, isLoading, agregarEvento } = useAgendaHoy();

  const formatFecha = (date: Date) =>
    date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' }) +
    ' ' +
    date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });

  // ─── iOS: toggle picker inline ────────────────────────────────
  const togglePickerInicio = () => {
    setExpandedPicker(prev => prev === 'inicio' ? null : 'inicio');
  };

  const togglePickerFin = () => {
    setExpandedPicker(prev => prev === 'fin' ? null : 'fin');
  };

  // ─── iOS: onChange inline ─────────────────────────────────────
  const onChangeInicio = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) {
      const newInicio = new Date(selectedDate);
      setNewFechaInicio(newInicio);
      if (newFechaFin <= newInicio) {
        setNewFechaFin(new Date(newInicio.getTime() + 60 * 60 * 1000));
      }
    }
  };

  const onChangeFin = (_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (selectedDate) setNewFechaFin(new Date(selectedDate));
  };

  // ─── Android: flujo dos pasos ─────────────────────────────────
  const openPickerAndroid = (field: ActivePicker) => {
    const base = field === 'inicio' ? newFechaInicio : newFechaFin;
    setAndroidTempDate(new Date(base));
    setAndroidStep('date');
    setActivePicker(field);
  };

  const onChangeAndroid = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === 'dismissed' || !selectedDate) {
      setActivePicker(null);
      return;
    }
    if (androidStep === 'date') {
      setAndroidTempDate(selectedDate);
      setAndroidStep('time');
    } else {
      const combined = new Date(androidTempDate);
      combined.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
      if (activePicker === 'inicio') {
        setNewFechaInicio(combined);
        if (newFechaFin <= combined) {
          setNewFechaFin(new Date(combined.getTime() + 60 * 60 * 1000));
        }
      }
      else {
        setNewFechaFin(combined);
      }
      setActivePicker(null);
    }
  };

  const resetForm = () => {
    setNewTitulo('');
    setNewDescripcion('');
    setNewTipo('tarea');
    setNewExpediente(null);
    setNewFechaInicio(new Date());
    setNewFechaFin(new Date(Date.now() + 60 * 60 * 1000));
    setExpandedPicker(null);
  };

  const handleCloseModal = () => {
    resetForm();
    setAddModalVisible(false);
  };

  const handleGuardarEvento = async () => {
    if (!newTitulo.trim()) {
      Alert.alert('Falta título', 'Debes ingresar un título para la tarea.');
      return;
    }
    if (newFechaFin <= newFechaInicio) {
      Alert.alert('Fechas inválidas', 'La fecha de finalización debe ser posterior a la de inicio.');
      return;
    }
    setIsAdding(true);
    try {
      await agregarEvento({
        titulo: newTitulo.trim(),
        descripcion: newDescripcion.trim() || null,
        tipo_evento: newTipo,
        estado: 'pendiente',
        fecha_inicio: newFechaInicio.toISOString(),
        fecha_fin: newFechaFin.toISOString(),
        asignado_a: '',
        creado_por: '',
        expediente_id: newExpediente,
      });
      resetForm();
      setAddModalVisible(false);
    } catch {
      Alert.alert('Error', 'No se pudo guardar la tarea. Inténtalo de nuevo.');
    } finally {
      setIsAdding(false);
    }
  };

  const toggleCompletada = (id: string) => {
    setCompletadas(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  const handleCheckin = useCallback(async () => {
    if (checkinStatus === 'loading') return;
    setCheckinStatus('loading');
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permiso denegado', 'Habilita el permiso de ubicación en Configuración.', [{ text: 'Entendido' }]);
        setCheckinStatus('idle');
        return;
      }
      const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      const { latitude, longitude } = location.coords;
      const timeString = new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
      setLastCheckin(timeString);
      setCheckinStatus('success');
      Alert.alert('✅ Check-in registrado', `Hora: ${timeString}\nCoordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`, [{ text: 'OK' }]);
      setTimeout(() => setCheckinStatus('idle'), 3000);
    } catch {
      Alert.alert('Error', 'No se pudo obtener la ubicación. Verifica que el GPS esté activo.', [{ text: 'Reintentar' }]);
      setCheckinStatus('idle');
    }
  }, [checkinStatus]);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>

        {/* Header */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-base text-slate-500 font-medium">{getGreeting()} 👋</Text>
          <Text className="text-3xl font-black text-slate-900 tracking-tight mt-1">Dr. Iturri</Text>
        </View>

        {/* Check-in Card */}
        <View className="px-6 mt-5">
          <View className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="location" size={20} color="#2563EB" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-slate-900 font-bold text-base">Check-in de asistencia</Text>
                <Text className="text-slate-400 text-sm mt-0.5">Registra tu presencia en el juzgado</Text>
              </View>
            </View>
            {lastCheckin && (
              <View className="flex-row items-center bg-emerald-50 rounded-lg px-3 py-2 mb-4">
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text className="text-emerald-700 text-sm font-medium ml-2">Último check-in: {lastCheckin}</Text>
              </View>
            )}
            <TouchableOpacity
              onPress={handleCheckin}
              disabled={checkinStatus === 'loading'}
              activeOpacity={0.8}
              className={`rounded-xl py-4 items-center justify-center flex-row ${checkinStatus === 'success' ? 'bg-emerald-500' : checkinStatus === 'loading' ? 'bg-blue-400' : 'bg-blue-600'
                }`}
            >
              {checkinStatus === 'loading' ? (
                <><ActivityIndicator size="small" color="#FFFFFF" /><Text className="text-white font-bold text-lg ml-3">Obteniendo ubicación…</Text></>
              ) : checkinStatus === 'success' ? (
                <><Ionicons name="checkmark-circle" size={24} color="#FFFFFF" /><Text className="text-white font-bold text-lg ml-2">¡Registrado!</Text></>
              ) : (
                <><Ionicons name="navigate" size={22} color="#FFFFFF" /><Text className="text-white font-bold text-lg ml-2">Hacer Check-in</Text></>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Agenda de Hoy */}
        <View className="px-6 mt-8">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#2563EB" />
              <Text className="text-slate-900 font-bold text-lg ml-2">Agenda de Hoy</Text>
            </View>
            <Text className="text-slate-400 text-sm font-medium">
              {new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}
            </Text>
          </View>
          {isLoading ? (
            <View className="py-6 items-center"><ActivityIndicator size="small" color="#2563EB" /></View>
          ) : eventos.length === 0 ? (
            <View className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm items-center">
              <Text className="text-slate-500 text-center">No tienes audiencias ni tareas pendientes para hoy.</Text>
            </View>
          ) : (
            eventos.map((item, index) => {
              const iconInfo = getAgendaIcon(item.tipo_evento);
              const hora = new Date(item.fecha_inicio).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
              const isCompletada = completadas.includes(item.id);
              return (
                <View
                  key={item.id}
                  className={`bg-white rounded-xl p-4 border shadow-sm ${isCompletada ? 'border-emerald-100 bg-slate-50 opacity-80' : 'border-slate-200'} ${index < eventos.length - 1 ? 'mb-3' : ''}`}
                >
                  <View className="flex-row items-start">
                    <View className={`items-center mr-4 ${isCompletada ? 'opacity-50' : ''}`}>
                      <Text className="text-blue-600 font-bold text-sm">{hora}</Text>
                      <View className={`w-9 h-9 rounded-full items-center justify-center mt-2 ${iconInfo.bg}`}>
                        <Ionicons name={iconInfo.name} size={18} color={iconInfo.color} />
                      </View>
                    </View>
                    <View className="flex-1">
                      <Text className={`font-semibold text-base ${isCompletada ? 'text-slate-400 line-through' : 'text-slate-900'}`} numberOfLines={2}>
                        {item.titulo}
                      </Text>
                      {item.descripcion && (
                        <View className="flex-row items-center mt-1.5">
                          <Ionicons name="document-text-outline" size={14} color={isCompletada ? '#CBD5E1' : '#94A3B8'} />
                          <Text className={`text-sm ml-1 ${isCompletada ? 'text-slate-400 line-through' : 'text-slate-400'}`} numberOfLines={1}>
                            {item.descripcion}
                          </Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => toggleCompletada(item.id)} activeOpacity={0.7} className="ml-2 py-1 px-1 justify-center items-center">
                      <Ionicons name={isCompletada ? 'checkmark-circle' : 'ellipse-outline'} size={28} color={isCompletada ? '#10B981' : '#CBD5E1'} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setAddModalVisible(true)}
        className="absolute bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center"
        style={{ shadowColor: '#2563EB', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 5 }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Modal de Creación — sin Modal anidado, sin pointerEvents problemático */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <View style={StyleSheet.absoluteFillObject}>
          {/* Overlay: View pura, no TouchableOpacity, para evitar conflicto de gestos */}
          <TouchableOpacity
            style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.5)' }]}
            onPress={handleCloseModal}
            activeOpacity={1}
          />

          {/* Sheet — pegado al fondo con posición absoluta, sin KAV */}
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              maxHeight: SCREEN_HEIGHT * 0.92,
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              elevation: 20,
            }}
          >
            {/* Handle */}
            <View style={{ width: 48, height: 5, borderRadius: 3, backgroundColor: '#CBD5E1', alignSelf: 'center', marginTop: 12, marginBottom: 8 }} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="always"
              keyboardDismissMode="on-drag"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 48 }}
            >
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#0F172A', marginBottom: 24, marginTop: 8 }}>
                Nueva Tarea / Audiencia
              </Text>

              {/* Título */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Título</Text>
                <TextInput
                  value={newTitulo}
                  onChangeText={setNewTitulo}
                  placeholder="Ej. Presentar memorial"
                  placeholderTextColor="#94A3B8"
                  style={styles.input}
                />
              </View>

              {/* Descripción */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Descripción (Opcional)</Text>
                <TextInput
                  value={newDescripcion}
                  onChangeText={setNewDescripcion}
                  placeholder="Detalles adicionales..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  style={[styles.input, { textAlignVertical: 'top', minHeight: 80 }]}
                />
              </View>

              {/* Tipo */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Tipo de Evento</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {TIPO_OPTIONS.map(opt => (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => setNewTipo(opt.value)}
                      style={[styles.chip, newTipo === opt.value && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, newTipo === opt.value && styles.chipTextActive]}>{opt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Asignado */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Asignado a</Text>
                <View style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}>
                  <Ionicons name="person-outline" size={18} color="#6B7280" />
                  <Text style={{ color: '#0F172A', fontSize: 16, marginLeft: 12, fontWeight: '500' }}>Dr. Juan Iturri</Text>
                </View>
              </View>

              {/* ── Fecha Inicio ── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Fecha Inicio</Text>
                <TouchableOpacity
                  onPress={Platform.OS === 'ios' ? togglePickerInicio : () => openPickerAndroid('inicio')}
                  activeOpacity={0.7}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                  <Text style={{ color: '#0F172A', fontSize: 16, marginLeft: 12, flex: 1 }}>{formatFecha(newFechaInicio)}</Text>
                  {Platform.OS === 'ios' && (
                    <Ionicons name={expandedPicker === 'inicio' ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>

                {/* Picker iOS inline — se expande debajo del campo, sin Modal */}
                {Platform.OS === 'ios' && expandedPicker === 'inicio' && (
                  <View style={styles.inlinePicker}>
                    <DateTimePicker
                      value={newFechaInicio}
                      mode="datetime"
                      display="spinner"
                      onChange={onChangeInicio}
                      locale="es-MX"
                      style={{ height: 180 }}
                      textColor="#0F172A"
                      themeVariant="light"
                    />
                    <TouchableOpacity
                      onPress={() => setExpandedPicker(null)}
                      style={styles.inlinePickerDone}
                    >
                      <Text style={styles.inlinePickerDoneText}>Listo ✓</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* ── Fecha Fin ── */}
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.label}>Fecha Fin</Text>
                <TouchableOpacity
                  onPress={Platform.OS === 'ios' ? togglePickerFin : () => openPickerAndroid('fin')}
                  activeOpacity={0.7}
                  style={[styles.input, { flexDirection: 'row', alignItems: 'center' }]}
                >
                  <Ionicons name="calendar-outline" size={18} color="#059669" />
                  <Text style={{ color: '#0F172A', fontSize: 16, marginLeft: 12, flex: 1 }}>{formatFecha(newFechaFin)}</Text>
                  {Platform.OS === 'ios' && (
                    <Ionicons name={expandedPicker === 'fin' ? 'chevron-up' : 'chevron-down'} size={18} color="#94A3B8" />
                  )}
                </TouchableOpacity>

                {Platform.OS === 'ios' && expandedPicker === 'fin' && (
                  <View style={styles.inlinePicker}>
                    <DateTimePicker
                      value={newFechaFin}
                      mode="datetime"
                      display="spinner"
                      onChange={onChangeFin}
                      locale="es-MX"
                      style={{ height: 180 }}
                      textColor="#0F172A"
                      themeVariant="light"
                    />
                    <TouchableOpacity
                      onPress={() => setExpandedPicker(null)}
                      style={styles.inlinePickerDone}
                    >
                      <Text style={styles.inlinePickerDoneText}>Listo ✓</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              {/* Expediente */}
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.label}>Expediente Vinculado (Opcional)</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNewExpediente(null)}
                    style={[styles.chip, newExpediente === null && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, newExpediente === null && styles.chipTextActive]}>— Ninguno —</Text>
                  </TouchableOpacity>
                  {expedientesDisponibles.map(exp => (
                    <TouchableOpacity
                      key={exp.id}
                      activeOpacity={0.7}
                      onPress={() => setNewExpediente(exp.id)}
                      style={[styles.chip, newExpediente === exp.id && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, newExpediente === exp.id && styles.chipTextActive]}>{exp.numero_caso}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Guardar */}
              <TouchableOpacity
                onPress={handleGuardarEvento}
                disabled={isAdding}
                activeOpacity={0.8}
                style={{ backgroundColor: isAdding ? '#93C5FD' : '#2563EB', borderRadius: 14, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <><Ionicons name="save-outline" size={20} color="#FFFFFF" /><Text style={{ color: 'white', fontWeight: '700', fontSize: 16, marginLeft: 8 }}>Guardar</Text></>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCloseModal}
                activeOpacity={0.7}
                style={{ borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 12 }}
              >
                <Text style={{ color: '#64748B', fontWeight: '700', fontSize: 16 }}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Android picker — fuera del Modal, montado en la raíz */}
      {Platform.OS !== 'ios' && activePicker !== null && (
        <DateTimePicker
          value={androidTempDate}
          mode={androidStep}
          display="default"
          onChange={onChangeAndroid}
          is24Hour
          locale="es-MX"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#0F172A',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  chipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  chipTextActive: {
    color: 'white',
  },
  inlinePicker: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 8,
    overflow: 'hidden',
  },
  inlinePickerDone: {
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  inlinePickerDoneText: {
    color: '#2563EB',
    fontWeight: '700',
    fontSize: 15,
  },
});