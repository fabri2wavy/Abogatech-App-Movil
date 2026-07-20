import React, { useState } from 'react';
import {
  View,
  Text,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { useRouter } from 'expo-router';

// ─── ProfileScreen ───────────────────────────────────────────────
export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const router = useRouter();

  React.useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (perfilData) {
        setProfile({
          ...perfilData,
          email: user.email,
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Logout handler ─────────────────────────────────────────────
  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que deseas cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar Sesión',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth/login');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  const initials = profile?.nombre ? `${profile.nombre.charAt(0)}${profile.apellidos?.charAt(0) || ''}`.toUpperCase() : 'JI';

  // ─── Render ────────────────────────────────────────────────────
  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <View className="items-center pt-8 pb-6">
          {/* Avatar */}
          <View className="w-24 h-24 rounded-full bg-blue-600 items-center justify-center mb-4 shadow-lg">
            <Text className="text-white text-3xl font-black tracking-wider">
              {initials}
            </Text>
          </View>

          {/* Name & Role */}
          <Text className="text-2xl font-black text-slate-900 tracking-tight">
            {profile?.nombre} {profile?.apellidos}
          </Text>
          <Text className="text-base text-slate-400 font-medium mt-1 capitalize">
            {profile?.rol || 'Abogado'} - Iturri & Asociados
          </Text>
        </View>

        {/* ── Información Personal ────────────────────────────── */}
        <View className="px-6 mt-2">
          <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
            Información Personal
          </Text>

          <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Teléfono */}
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 rounded-full bg-blue-50 items-center justify-center">
                <Ionicons name="call-outline" size={20} color="#2563EB" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  Teléfono
                </Text>
                <Text className="text-base text-slate-900 font-semibold mt-0.5">
                  {profile?.telefono || 'No registrado'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 mx-5" />

            {/* Correo */}
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 rounded-full bg-emerald-50 items-center justify-center">
                <Ionicons name="mail-outline" size={20} color="#059669" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-xs text-slate-400 font-semibold uppercase tracking-wide">
                  Correo electrónico
                </Text>
                <Text className="text-base text-slate-900 font-semibold mt-0.5">
                  {profile?.email || 'No registrado'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </View>
          </View>
        </View>

        {/* ── Seguridad y Preferencias ────────────────────────── */}
        <View className="px-6 mt-8">
          <Text className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3 ml-1">
            Seguridad y Preferencias
          </Text>

          <View className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Biometría */}
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 rounded-full bg-violet-50 items-center justify-center">
                <Ionicons name="finger-print-outline" size={20} color="#7C3AED" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base text-slate-900 font-semibold">
                  Usar Biometría
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Face ID / Huella dactilar
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#E2E8F0', true: '#818CF8' }}
                thumbColor={biometricEnabled ? '#7C3AED' : '#F1F5F9'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>

            {/* Divider */}
            <View className="h-px bg-slate-100 mx-5" />

            {/* Notificaciones Push */}
            <View className="flex-row items-center px-5 py-4">
              <View className="w-10 h-10 rounded-full bg-amber-50 items-center justify-center">
                <Ionicons name="notifications-outline" size={20} color="#D97706" />
              </View>
              <View className="ml-4 flex-1">
                <Text className="text-base text-slate-900 font-semibold">
                  Notificaciones Push
                </Text>
                <Text className="text-xs text-slate-400 mt-0.5">
                  Alertas de audiencias y plazos
                </Text>
              </View>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ false: '#E2E8F0', true: '#FCD34D' }}
                thumbColor={pushEnabled ? '#D97706' : '#F1F5F9'}
                ios_backgroundColor="#E2E8F0"
              />
            </View>
          </View>
        </View>

        {/* ── Cerrar Sesión ───────────────────────────────────── */}
        <View className="px-6 mt-10">
          <TouchableOpacity
            onPress={handleLogout}
            activeOpacity={0.7}
            className="bg-white rounded-2xl border border-red-100 shadow-sm flex-row items-center justify-center py-4"
          >
            <Ionicons name="log-out-outline" size={22} color="#EF4444" />
            <Text className="text-red-500 font-bold text-base ml-2">
              Cerrar Sesión
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── App Version ─────────────────────────────────────── */}
        <View className="items-center mt-8">
          <Text className="text-xs text-slate-300 font-medium">
            Abogatech v1.0.0 — MVP
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
