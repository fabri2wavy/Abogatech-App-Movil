import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  const handleResetPassword = () => {
    console.log('Solicitando recuperación para:', email);
    alert('Si el correo existe, recibirás un enlace de recuperación.');
    router.back();
  };

  return (
    // KeyboardAvoidingView ajusta la pantalla cuando el teclado se despliega en cualquier dispositivo
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#000000]"
    >
      {/* SafeAreaView garantiza que ningún elemento choque con Notches, Cámaras o Dynamic Islands */}
      <SafeAreaView className="flex-1 px-6">
        
        {/* Barra superior adaptativa para el botón de regresar */}
        <View className="h-14 flex-row items-center justify-start mt-2">
          <TouchableOpacity 
            onPress={() => router.back()}
            className="w-11 h-11 items-center justify-center bg-[#1E293B] rounded-full active:opacity-70 border border-slate-800"
          >
            <Ionicons name="arrow-back" size={22} color="#3B82F6" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingBottom: 40 }} 
          className="flex-1"
          showsVerticalScrollIndicator={false}
        >

          {/* Cabecera / Identidad */}
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-[#1D4ED8]/20 items-center justify-center mb-6 shadow-sm">
              <Ionicons name="key-outline" size={34} color="#3B82F6" />
            </View>
            <Text className="text-white text-3xl font-extrabold tracking-tight text-center">
              Recuperar Contraseña
            </Text>
            <Text className="text-slate-400 text-sm mt-3 text-center px-4 leading-relaxed">
              Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu acceso a Abogatech.
            </Text>
          </View>

          {/* Formulario */}
          <View className="space-y-5">
            
            {/* Input de Correo */}
            <View>
              <Text className="text-slate-300 text-sm font-medium mb-2 pl-1">
                Correo Electrónico Registrado
              </Text>
              <View className="w-full h-14 bg-[#1E293B] rounded-xl flex-row items-center px-4 border border-slate-700/50 focus:border-[#1D4ED8]">
                <Ionicons name="mail-outline" size={20} color="#64748B" className="mr-3" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@abogatech.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-white text-base h-full"
                />
              </View>
            </View>

          </View>

          {/* Acción de Recuperación */}
          <View className="mt-8">
            <TouchableOpacity
              onPress={handleResetPassword}
              className="w-full h-14 bg-[#1D4ED8] rounded-xl items-center justify-center active:bg-[#6D28D9] shadow-lg shadow-purple-900/40"
            >
              <Text className="text-white text-lg font-bold tracking-wide">
                Enviar Enlace
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}