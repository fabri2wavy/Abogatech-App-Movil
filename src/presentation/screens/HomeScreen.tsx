import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ─── Option types for selectors ────────────────────────────────
const TIPO_OPTIONS = [
  { label: '📋 Tarea', value: 'tarea' },
  { label: '🎙️ Audiencia', value: 'audiencia' },
  { label: '👥 Reunión', value: 'reunion' },
  { label: '📍 Check-in', value: 'checkin' },
];

// ─── Types ───────────────────────────────────────────────────────
type CheckinStatus = 'idle' | 'loading' | 'success';

import { useAgendaHoy } from '../hooks/useAgendaHoy';
import type { AgendaEvento } from '../../domain/entities/AgendaEvento';

function getAgendaIcon(tipo_evento?: string | null) {
  const normalizedTipo = tipo_evento?.toLowerCase() || '';
  if (normalizedTipo.includes('audiencia')) {
    return { name: 'mic-outline' as const, bg: 'bg-blue-50', color: '#2563EB' };
  } else if (normalizedTipo.includes('reunion')) {
    return { name: 'people-outline' as const, bg: 'bg-emerald-50', color: '#059669' };
  }
  return { name: 'document-text-outline' as const, bg: 'bg-amber-50', color: '#D97706' };
}

// ─── HomeScreen ──────────────────────────────────────────────────
export default function HomeScreen() {
  const [checkinStatus, setCheckinStatus] = useState<CheckinStatus>('idle');
  const [lastCheckin, setLastCheckin] = useState<string | null>(null);
  const [completadas, setCompletadas] = useState<string[]>([]);
  
  // ─── Creation form state ───────────────────────────────────────
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [newTitulo, setNewTitulo] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newTipo, setNewTipo] = useState('tarea');
  const [newAsignado, setNewAsignado] = useState('Dr. Juan Iturri');
  const [newExpediente, setNewExpediente] = useState<string | null>(null);
  const [newFechaInicio, setNewFechaInicio] = useState(new Date());
  const [newFechaFin, setNewFechaFin] = useState(new Date(Date.now() + 60 * 60 * 1000)); // +1h
  const [showPickerInicio, setShowPickerInicio] = useState(false);
  const [showPickerFin, setShowPickerFin] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const { eventos, expedientesDisponibles, isLoading, agregarEvento } = useAgendaHoy();

  // ─── Format date for display ───────────────────────────────────
  const formatFecha = (date: Date) =>
    date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }) +
    ' ' +
    date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
    });

  // ─── Date Picker Handlers ──────────────────────────────────────
  const onChangeInicio = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPickerInicio(false);
    }
    if (selectedDate && selectedDate.getTime() !== newFechaInicio.getTime()) {
      setNewFechaInicio(selectedDate);
    }
  };

  const onChangeFin = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS !== 'ios') {
      setShowPickerFin(false);
    }
    if (selectedDate && selectedDate.getTime() !== newFechaFin.getTime()) {
      setNewFechaFin(selectedDate);
    }
  };

  // ─── Reset form ────────────────────────────────────────────────
  const resetForm = () => {
    setNewTitulo('');
    setNewDescripcion('');
    setNewTipo('tarea');
    setNewAsignado('Dr. Juan Iturri');
    setNewExpediente(null);
    setNewFechaInicio(new Date());
    setNewFechaFin(new Date(Date.now() + 60 * 60 * 1000));
  };

  // ─── Save new event ────────────────────────────────────────────
  const handleGuardarEvento = async () => {
    if (!newTitulo.trim()) {
      Alert.alert('Falta título', 'Debes ingresar un título para la tarea.');
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
        asignado_a: '', // Will be overridden in hook
        creado_por: '', // Will be overridden in hook
        expediente_id: newExpediente,
      });
      resetForm();
      setAddModalVisible(false);
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la tarea. Inténtalo de nuevo.');
    } finally {
      setIsAdding(false);
    }
  };

  // ─── Inline Completion Toggle ──────────────────────────────────
  const toggleCompletada = (id: string) => {
    setCompletadas((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // ─── Greeting based on time of day ────────────────────────────
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos días';
    if (hour < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  // ─── Check-in handler ─────────────────────────────────────────
  const handleCheckin = useCallback(async () => {
    if (checkinStatus === 'loading') return;

    setCheckinStatus('loading');

    try {
      // 1. Request foreground location permission
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert(
          'Permiso denegado',
          'Necesitamos acceso a tu ubicación para registrar el check-in. Habilita el permiso en Configuración.',
          [{ text: 'Entendido' }]
        );
        setCheckinStatus('idle');
        return;
      }

      // 2. Get current position
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const { latitude, longitude } = location.coords;
      const timestamp = new Date();
      const timeString = timestamp.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });

      setLastCheckin(timeString);
      setCheckinStatus('success');

      Alert.alert(
        '✅ Check-in registrado',
        `Hora: ${timeString}\nCoordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        [{ text: 'OK' }]
      );

      // Reset to idle after 3 seconds
      setTimeout(() => setCheckinStatus('idle'), 3000);
    } catch (error) {
      console.error('Error en check-in:', error);
      Alert.alert(
        'Error',
        'No se pudo obtener la ubicación. Verifica que el GPS esté activo e intenta de nuevo.',
        [{ text: 'Reintentar' }]
      );
      setCheckinStatus('idle');
    }
  }, [checkinStatus]);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header / Welcome ──────────────────────────────────── */}
        <View className="px-6 pt-6 pb-2">
          <Text className="text-base text-slate-500 font-medium">
            {getGreeting()} 👋
          </Text>
          <Text className="text-3xl font-black text-slate-900 tracking-tight mt-1">
            Dr. Iturri
          </Text>
        </View>

        {/* ── Check-in Card ─────────────────────────────────────── */}
        <View className="px-6 mt-5">
          <View className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            {/* Card header */}
            <View className="flex-row items-center mb-4">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="location" size={20} color="#2563EB" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-slate-900 font-bold text-base">
                  Check-in de asistencia
                </Text>
                <Text className="text-slate-400 text-sm mt-0.5">
                  Registra tu presencia en el juzgado
                </Text>
              </View>
            </View>

            {/* Last check-in info */}
            {lastCheckin && (
              <View className="flex-row items-center bg-emerald-50 rounded-lg px-3 py-2 mb-4">
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text className="text-emerald-700 text-sm font-medium ml-2">
                  Último check-in: {lastCheckin}
                </Text>
              </View>
            )}

            {/* Check-in button */}
            <TouchableOpacity
              onPress={handleCheckin}
              disabled={checkinStatus === 'loading'}
              activeOpacity={0.8}
              className={`rounded-xl py-4 items-center justify-center flex-row ${
                checkinStatus === 'success'
                  ? 'bg-emerald-500'
                  : checkinStatus === 'loading'
                    ? 'bg-blue-400'
                    : 'bg-blue-600'
              }`}
            >
              {checkinStatus === 'loading' ? (
                <>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-3">
                    Obteniendo ubicación…
                  </Text>
                </>
              ) : checkinStatus === 'success' ? (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    ¡Registrado!
                  </Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate" size={22} color="#FFFFFF" />
                  <Text className="text-white font-bold text-lg ml-2">
                    Hacer Check-in
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Agenda de Hoy ─────────────────────────────────────── */}
        <View className="px-6 mt-8">
          {/* Section header */}
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center">
              <Ionicons name="calendar" size={20} color="#2563EB" />
              <Text className="text-slate-900 font-bold text-lg ml-2">
                Agenda de Hoy
              </Text>
            </View>
            <Text className="text-slate-400 text-sm font-medium">
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </Text>
          </View>

          {/* Agenda items or States */}
          {isLoading ? (
            <View className="py-6 items-center">
              <ActivityIndicator size="small" color="#2563EB" />
            </View>
          ) : eventos.length === 0 ? (
            <View className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm items-center">
              <Text className="text-slate-500 text-center">
                No tienes audiencias ni tareas pendientes para hoy.
              </Text>
            </View>
          ) : (
            eventos.map((item, index) => {
              const iconInfo = getAgendaIcon(item.tipo_evento);
              const hora = new Date(item.fecha_inicio).toLocaleTimeString('es-MX', {
                hour: '2-digit',
                minute: '2-digit',
              });
              
              const isCompletada = completadas.includes(item.id);

              return (
                <View
                  key={item.id}
                  className={`bg-white rounded-xl p-4 border shadow-sm ${
                    isCompletada ? 'border-emerald-100 bg-slate-50 opacity-80' : 'border-slate-200'
                  } ${index < eventos.length - 1 ? 'mb-3' : ''}`}
                >
                  <View className="flex-row items-start">
                    {/* Time + Icon */}
                    <View className={`items-center mr-4 ${isCompletada ? 'opacity-50' : ''}`}>
                      <Text className="text-blue-600 font-bold text-sm">
                        {hora}
                      </Text>
                      <View
                        className={`w-9 h-9 rounded-full items-center justify-center mt-2 ${iconInfo.bg}`}
                      >
                        <Ionicons
                          name={iconInfo.name}
                          size={18}
                          color={iconInfo.color}
                        />
                      </View>
                    </View>

                    {/* Content */}
                    <View className="flex-1">
                      <Text
                        className={`font-semibold text-base ${
                          isCompletada ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                        numberOfLines={2}
                      >
                        {item.titulo}
                      </Text>
                      {item.descripcion && (
                        <View className="flex-row items-center mt-1.5">
                          <Ionicons name="document-text-outline" size={14} color={isCompletada ? "#CBD5E1" : "#94A3B8"} />
                          <Text 
                            className={`text-sm ml-1 ${isCompletada ? 'text-slate-400 line-through' : 'text-slate-400'}`} 
                            numberOfLines={1}
                          >
                            {item.descripcion}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Toggle Button */}
                    <TouchableOpacity
                      onPress={() => toggleCompletada(item.id)}
                      activeOpacity={0.7}
                      className="ml-2 py-1 px-1 justify-center items-center"
                    >
                      <Ionicons
                        name={isCompletada ? "checkmark-circle" : "ellipse-outline"}
                        size={28}
                        color={isCompletada ? "#10B981" : "#CBD5E1"}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ── Botón Flotante (FAB) ─────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => setAddModalVisible(true)}
        className="absolute bottom-28 right-6 w-14 h-14 bg-blue-600 rounded-full items-center justify-center shadow-lg elevation-5"
        style={{
          shadowColor: '#2563EB',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
        }}
      >
        <Ionicons name="add" size={30} color="#FFFFFF" />
      </TouchableOpacity>

      {/* ── Modal de Creación ─────────────────────────────────────── */}
      <Modal
        visible={addModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setAddModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1, justifyContent: 'flex-end' }}
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setAddModalVisible(false)}
            className="flex-1 bg-black/50"
          />

          <View
            className="bg-white rounded-t-3xl shadow-lg"
            style={{ maxHeight: SCREEN_HEIGHT * 0.9 }}
          >
            {/* Handle bar */}
            <View
              style={{
                width: 48,
                height: 5,
                borderRadius: 3,
                backgroundColor: '#CBD5E1',
                alignSelf: 'center',
                marginTop: 12,
                marginBottom: 8,
              }}
            />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
            >
              <Text className="text-2xl font-black text-slate-900 tracking-tight mb-6 mt-2">
                Nueva Tarea / Audiencia
              </Text>

              {/* ─── Título ─────────────────────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Título
                </Text>
                <TextInput
                  value={newTitulo}
                  onChangeText={setNewTitulo}
                  placeholder="Ej. Presentar memorial"
                  placeholderTextColor="#94A3B8"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base"
                />
              </View>

              {/* ─── Descripción ────────────────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Descripción (Opcional)
                </Text>
                <TextInput
                  value={newDescripcion}
                  onChangeText={setNewDescripcion}
                  placeholder="Detalles adicionales..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={3}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 text-base"
                  style={{ textAlignVertical: 'top', minHeight: 80 }}
                />
              </View>

              {/* ─── Tipo de Evento (chips) ────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  Tipo de Evento
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {TIPO_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      activeOpacity={0.7}
                      onPress={() => setNewTipo(opt.value)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        newTipo === opt.value
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          newTipo === opt.value ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ─── Asignado a ─────────────────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Asignado a
                </Text>
                <View className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center">
                  <Ionicons name="person-outline" size={18} color="#6B7280" />
                  <Text className="text-slate-900 text-base ml-3 font-medium">Dr. Juan Iturri</Text>
                </View>
              </View>

              {/* ─── Fecha Inicio ──────────────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Fecha Inicio
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPickerInicio(true)}
                  activeOpacity={0.7}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center"
                >
                  <Ionicons name="calendar-outline" size={18} color="#2563EB" />
                  <Text className="text-slate-900 text-base ml-3">
                    {formatFecha(newFechaInicio)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ─── Fecha Fin ─────────────────────────────── */}
              <View className="mb-5">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 ml-1">
                  Fecha Fin
                </Text>
                <TouchableOpacity
                  onPress={() => setShowPickerFin(true)}
                  activeOpacity={0.7}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 flex-row items-center"
                >
                  <Ionicons name="calendar-outline" size={18} color="#059669" />
                  <Text className="text-slate-900 text-base ml-3">
                    {formatFecha(newFechaFin)}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ─── Expediente Vinculado (chips dinámicos) ──────────── */}
              <View className="mb-6">
                <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 ml-1">
                  Expediente Vinculado (Opcional)
                </Text>
                <View className="flex-row flex-wrap" style={{ gap: 8 }}>
                  {/* Opción Nula (Ninguno) */}
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setNewExpediente(null)}
                    className={`px-4 py-2.5 rounded-xl border ${
                      newExpediente === null
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        newExpediente === null ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      — Ninguno —
                    </Text>
                  </TouchableOpacity>

                  {/* Opciones Dinámicas */}
                  {expedientesDisponibles.map((exp) => (
                    <TouchableOpacity
                      key={exp.id}
                      activeOpacity={0.7}
                      onPress={() => setNewExpediente(exp.id)}
                      className={`px-4 py-2.5 rounded-xl border ${
                        newExpediente === exp.id
                          ? 'bg-blue-600 border-blue-600'
                          : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-sm font-semibold ${
                          newExpediente === exp.id ? 'text-white' : 'text-slate-700'
                        }`}
                      >
                        {exp.numero_caso}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ─── Botones ──────────────────────────────── */}
              <TouchableOpacity
                onPress={handleGuardarEvento}
                disabled={isAdding}
                activeOpacity={0.8}
                className={`rounded-xl py-4 flex-row items-center justify-center ${
                  isAdding ? 'bg-blue-400' : 'bg-blue-600'
                }`}
              >
                {isAdding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="save-outline" size={20} color="#FFFFFF" />
                    <Text className="text-white font-bold text-base ml-2">Guardar</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  setAddModalVisible(false);
                }}
                activeOpacity={0.7}
                className="border border-slate-200 rounded-xl py-4 items-center justify-center mt-3"
              >
                <Text className="text-slate-500 font-bold text-base">Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── DateTimePickers (iOS Bottom Sheet & Android Native) ────────── */}
      {Platform.OS === 'ios' && (
        <>
          <Modal visible={showPickerInicio} transparent animationType="slide" onRequestClose={() => setShowPickerInicio(false)}>
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-lg">
                <View className="flex-row justify-between items-center mb-4 px-2">
                  <Text className="text-lg font-bold text-slate-900">Fecha y Hora Inicio</Text>
                  <TouchableOpacity onPress={() => setShowPickerInicio(false)}>
                    <Text className="text-blue-600 font-bold text-base">Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newFechaInicio}
                  mode="datetime"
                  display="spinner"
                  onChange={onChangeInicio}
                />
              </View>
            </View>
          </Modal>

          <Modal visible={showPickerFin} transparent animationType="slide" onRequestClose={() => setShowPickerFin(false)}>
            <View className="flex-1 justify-end bg-black/50">
              <View className="bg-white rounded-t-3xl p-6 pb-10 shadow-lg">
                <View className="flex-row justify-between items-center mb-4 px-2">
                  <Text className="text-lg font-bold text-slate-900">Fecha y Hora Fin</Text>
                  <TouchableOpacity onPress={() => setShowPickerFin(false)}>
                    <Text className="text-blue-600 font-bold text-base">Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={newFechaFin}
                  mode="datetime"
                  display="spinner"
                  onChange={onChangeFin}
                />
              </View>
            </View>
          </Modal>
        </>
      )}

      {showPickerInicio && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={newFechaInicio}
          mode="date"
          display="default"
          onChange={onChangeInicio}
        />
      )}

      {showPickerFin && Platform.OS !== 'ios' && (
        <DateTimePicker
          value={newFechaFin}
          mode="date"
          display="default"
          onChange={onChangeFin}
        />
      )}

    </SafeAreaView>
  );
}
