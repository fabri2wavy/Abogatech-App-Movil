import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const [isCheckedIn, setIsCheckedIn] = useState(false);

  const handleCheckIn = () => {
    console.log('Capturando GPS y enviando al CRM...');
    setIsCheckedIn(true);
  };

  return (
    // Fondo gris súper claro para que las tarjetas blancas resalten
    <SafeAreaView className="flex-1 bg-slate-50">
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera */}
        <View className="items-center mb-10">
          <Text className="text-blue-600 text-sm font-bold tracking-widest uppercase mb-2">
            Control de Asistencia
          </Text>
          <Text className="text-slate-900 text-3xl font-black text-center tracking-tight">
            Registro de Llegada
          </Text>
        </View>

        {/* Botón de Marcaje (Rediseñado para Modo Claro Corporativo) */}
        <View className="items-center justify-center my-8">
          <TouchableOpacity 
            onPress={handleCheckIn}
            disabled={isCheckedIn}
            className={`w-56 h-56 rounded-full items-center justify-center shadow-2xl border-4 ${
              isCheckedIn 
                ? 'bg-emerald-50 border-emerald-500 shadow-emerald-200' 
                : 'bg-white border-blue-600 shadow-blue-200'
            }`}
          >
            <Ionicons 
              name={isCheckedIn ? "checkmark-circle" : "finger-print"} 
              size={80} 
              // Usamos el Azul Corporativo (#2563EB) en lugar del morado
              color={isCheckedIn ? "#10B981" : "#2563EB"} 
            />
            <Text className={`mt-4 text-lg font-bold ${isCheckedIn ? 'text-emerald-700' : 'text-blue-700'}`}>
              {isCheckedIn ? 'Marcaje Exitoso' : 'Presionar para\nRegistrar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Información de Estado simulada (Tarjeta Blanca Clean) */}
        <View className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <View className="flex-row items-center mb-4">
            <Ionicons name="location" size={20} color="#2563EB" />
            <Text className="text-slate-600 ml-2 text-sm font-medium">Estado de Ubicación:</Text>
            <Text className="text-slate-900 ml-auto font-bold">Buscando señal...</Text>
          </View>
          <View className="flex-row items-center">
            <Ionicons name="time" size={20} color="#64748B" />
            <Text className="text-slate-600 ml-2 text-sm font-medium">Último marcaje:</Text>
            <Text className="text-slate-500 ml-auto font-medium">Sin registros hoy</Text>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}