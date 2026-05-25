import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [secureText, setSecureText] = useState(true);

  const handleLogin = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <SafeAreaView className="flex-1">
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }} 
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          
          <View className="items-center mb-10">
            <View className="w-16 h-16 rounded-2xl bg-blue-50 items-center justify-center mb-4 shadow-sm border border-blue-100">
              <Ionicons name="scale" size={36} color="#2563EB" />
            </View>
            <Text className="text-slate-900 text-3xl font-black tracking-tight">
              Abogatech
            </Text>
            <Text className="text-slate-500 text-sm mt-2 text-center px-4 leading-relaxed">
              Ingresa tus credenciales institucionales
            </Text>
          </View>

          <View className="space-y-5">
            <View>
              <Text className="text-slate-700 text-sm font-bold mb-2 pl-1">
                Correo Institucional
              </Text>
              <View className="w-full h-14 bg-slate-50 rounded-xl flex-row items-center px-4 border border-slate-200 focus:border-blue-600 focus:bg-white transition-colors">
                <Ionicons name="mail-outline" size={20} color="#64748B" className="mr-3" />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="ejemplo@abogatech.com"
                  placeholderTextColor="#94A3B8"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="flex-1 text-slate-900 text-base h-full"
                />
              </View>
            </View>

            <View>
              <Text className="text-slate-700 text-sm font-bold mb-2 pl-1">
                Contraseña
              </Text>
              <View className="w-full h-14 bg-slate-50 rounded-xl flex-row items-center px-4 border border-slate-200 focus:border-blue-600 focus:bg-white transition-colors">
                <Ionicons name="lock-closed-outline" size={20} color="#64748B" className="mr-3" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="••••••••"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={secureText}
                  autoCapitalize="none"
                  className="flex-1 text-slate-900 text-base h-full"
                />
                <TouchableOpacity onPress={() => setSecureText(!secureText)} className="p-2">
                  <Ionicons 
                    name={secureText ? "eye-off-outline" : "eye-outline"} 
                    size={20} 
                    color="#64748B" 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity 
              className="self-end mt-1"
              onPress={() => router.push('/auth/forgot-password')}
            >
              <Text className="text-blue-600 text-sm font-bold tracking-wide">
                ¿Olvidaste tu contraseña?
              </Text>
            </TouchableOpacity>
          </View>

          <View className="mt-8">
            <TouchableOpacity
              onPress={handleLogin}
              className="w-full h-14 bg-blue-600 rounded-xl items-center justify-center active:bg-blue-700 shadow-md shadow-blue-200"
            >
              <Text className="text-white text-lg font-bold tracking-wide">
                Iniciar Sesión
              </Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}