import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Simulamos los eventos que el backend del CRM web transmitirá a la app
const upcomingEvents = [
  {
    id: '1',
    type: 'hearing', // Audiencia
    title: 'Audiencia de Juicio Oral',
    caseNumber: 'EXP-4402/2025',
    time: '09:30 AM',
    location: 'Juzgado de Partido Ordinario 1° en lo Civil',
    // Colores cálidos para resaltar la urgencia (modo claro)
    badgeColor: 'bg-amber-50 text-amber-600 border-amber-200',
  },
  {
    id: '2',
    type: 'deadline', // Plazo perentorio
    title: 'Vencimiento de Término Probatorio',
    caseNumber: 'EXP-1105/2026',
    time: '18:00 PM',
    location: 'Juzgado de Instrucción Penal 3°',
    // Colores rojizos para alertas de plazo (modo claro)
    badgeColor: 'bg-rose-50 text-rose-600 border-rose-200',
  },
];

export default function CalendarScreen() {
  return (
    // Fondo gris súper claro para que las tarjetas blancas resalten
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera de Sincronización */}
        <View className="flex-row justify-between items-center mb-8 mt-2">
          <View>
            <Text className="text-slate-500 text-sm font-bold tracking-wide uppercase">Agenda de Campo</Text>
            <Text className="text-slate-900 text-2xl font-black tracking-tight mt-1">Sincronizada</Text>
          </View>
          <View className="flex-row items-center bg-white px-3 h-9 rounded-full border border-slate-200 shadow-sm">
            <View className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
            <Text className="text-slate-700 text-xs font-bold">CRM Web</Text>
          </View>
        </View>

        {/* Resumen del Día Actual (Tarjeta Blanca Clean) */}
        <View className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 flex-row items-center">
          <View className="w-12 h-12 bg-blue-50 rounded-xl items-center justify-center mr-4 border border-blue-100">
            <Ionicons name="today" size={24} color="#2563EB" />
          </View>
          <View>
            <Text className="text-slate-900 text-base font-bold">Hoy en los Tribunales</Text>
            <Text className="text-slate-500 text-xs mt-0.5 font-medium">Tienes 2 eventos pendientes de gestión</Text>
          </View>
        </View>

        {/* Lista de Eventos del CRM */}
        <Text className="text-slate-900 text-lg font-black mb-4">Próximas Actividades</Text>
        
        {upcomingEvents.map((event) => (
          <View key={event.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-4">
            
            {/* Tipo de evento y Expediente */}
            <View className="flex-row justify-between items-center mb-3">
              <View className={`px-2.5 py-1 rounded-md border ${event.badgeColor}`}>
                <Text className="text-xs font-bold uppercase tracking-wider">
                  {event.type === 'hearing' ? 'Audiencia' : 'Plazo'}
                </Text>
              </View>
              <Text className="text-slate-500 text-xs font-mono font-medium">{event.caseNumber}</Text>
            </View>

            {/* Título */}
            <Text className="text-slate-900 text-base font-bold leading-tight mb-3">
              {event.title}
            </Text>

            {/* Separador sutil */}
            <View className="w-full h-[1px] bg-slate-100 my-1" />

            {/* Detalles de hora y ubicación */}
            <View className="mt-2 space-y-2">
              <View className="flex-row items-center">
                <Ionicons name="time" size={16} color="#64748B" />
                <Text className="text-slate-600 text-xs ml-2 font-medium">{event.time}</Text>
              </View>
              <View className="flex-row items-center mt-1">
                <Ionicons name="business" size={16} color="#64748B" />
                <Text className="text-slate-600 text-xs ml-2 flex-1 font-medium" numberOfLines={1}>
                  {event.location}
                </Text>
              </View>
            </View>

            {/* Acción rápida para ver ruta/juzgado (Azul Corporativo) */}
            <TouchableOpacity className="mt-4 flex-row items-center justify-center bg-blue-50 h-10 rounded-xl border border-blue-100 active:bg-blue-100 transition-colors">
              <Ionicons name="navigate" size={16} color="#2563EB" />
              <Text className="text-blue-700 text-xs font-bold ml-2">Ver Ubicación del Juzgado</Text>
            </TouchableOpacity>

          </View>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}