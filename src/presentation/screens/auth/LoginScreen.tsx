import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleLogin = () => {
    console.log('Iniciando sesión con:', email, password);
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-[#0F172A]"
    >
      <ScrollView 
  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
  className="flex-1 px-6"
>
        
        {/* Cabecera / Identidad de Marca */}
        <View className="items-center mb-10">
          <View className="w-16 h-16 rounded-2xl bg-[#7C3AED]/20 items-center justify-center mb-4">
            <Ionicons name="scale" size={36} color="#A78BFA" />
          </View>
          <Text className="text-white text-3xl font-extrabold tracking-tight">
            Abogatech
          </Text>
          <Text className="text-slate-400 text-sm mt-2 text-center">
            Ingresa a tu ecosistema legal de alto rendimiento
          </Text>
        </View>

        {/* Formulario */}
        <View className="space-y-4">
          
          {/* Input de Correo */}
          <View>
            <Text className="text-slate-300 text-sm font-medium mb-2 pl-1">
              Correo Electrónico
            </Text>
            <View className="w-full h-14 bg-[#1E293B] rounded-xl flex-row items-center px-4 border border-slate-700 focus:border-[#7C3AED]">
              <Ionicons name="mail-outline" size={20} color="#64748B" className="mr-3" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="ejemplo@abogatech.com"
                placeholderTextColor="#64748B"
                keyboardType="email-address"
                autoCapitalize="none"
                className="flex-1 text-white text-base"
              />
            </View>
          </View>

          {/* Input de Contraseña */}
          <View className="mt-4">
            <Text className="text-slate-300 text-sm font-medium mb-2 pl-1">
              Contraseña
            </Text>
            <View className="w-full h-14 bg-[#1E293B] rounded-xl flex-row items-center px-4 border border-slate-700 focus:border-[#7C3AED]">
              <Ionicons name="lock-closed-outline" size={20} color="#64748B" className="mr-3" />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#64748B"
                secureTextEntry={secureText}
                autoCapitalize="none"
                className="flex-1 text-white text-base"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)}>
                <Ionicons 
                  name={secureText ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Olvidé mi contraseña */}
<TouchableOpacity 
            className="self-end mt-1"
            onPress={() => router.push('/auth/forgot-password')} 
          >
            <Text className="text-[#A78BFA] text-sm font-semibold tracking-wide">
              ¿Olvidaste tu contraseña?
            </Text>
          </TouchableOpacity>

        </View>

        {/* Acción de Entrada */}
        <View className="mt-8">
          <TouchableOpacity
            onPress={handleLogin}
            className="w-full h-14 bg-[#7C3AED] rounded-xl items-center justify-center active:bg-[#6D28D9] shadow-lg shadow-purple-950/50"
          >
            <Text className="text-white text-base font-bold tracking-wide">
              Iniciar Sesión
            </Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}