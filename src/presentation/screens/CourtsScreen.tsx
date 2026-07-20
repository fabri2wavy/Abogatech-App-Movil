import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useJuzgados } from '../hooks/useJuzgados';
import type { Juzgado } from '../../domain/entities/Juzgado';

export default function CourtsScreen() {
  const { juzgados, isLoading, error } = useJuzgados();
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Filter Logic ────────────────────────────────────────────────
  const filteredJuzgados = useMemo(() => {
    if (!searchQuery.trim()) return juzgados;
    const q = searchQuery.toLowerCase().trim();
    return juzgados.filter((j) => {
      const matchNombre = j.nombre?.toLowerCase().includes(q);
      const matchCategoria = j.categoria?.toLowerCase().includes(q);
      return matchNombre || matchCategoria;
    });
  }, [juzgados, searchQuery]);

  // ─── Open Maps ───────────────────────────────────────────────────
  const handleOpenMaps = async (direccion: string) => {
    // URL Encode to make it safe for HTTP request
    const query = encodeURIComponent(`${direccion} La Paz Bolivia`);
    const url = `https://maps.google.com/?q=${query}`;
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.error('No se pudo abrir la URL: ', url);
      }
    } catch (err) {
      console.error('Error al abrir mapas:', err);
    }
  };

  // ─── Render Item ─────────────────────────────────────────────────
  const renderItem = ({ item }: { item: Juzgado }) => (
    <View className="bg-white rounded-2xl p-5 mb-4 border border-slate-200 shadow-sm">
      {/* Categoria Badge */}
      {item.categoria && (
        <View className="self-start px-2.5 py-1 bg-indigo-50 rounded-full mb-2 border border-indigo-100">
          <Text className="text-xs font-bold text-indigo-700">
            {item.categoria.toUpperCase()}
          </Text>
        </View>
      )}

      {/* Nombre */}
      <Text className="text-slate-900 font-bold text-xl mb-3">
        {item.nombre}
      </Text>

      {/* Info: Edificio, Direccion, Piso */}
      <View className="space-y-2">
        {item.edificio && (
          <View className="flex-row items-start">
            <Ionicons name="business-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
            <Text className="text-slate-600 text-sm ml-2 flex-1">
              <Text className="font-semibold text-slate-700">Edificio: </Text>
              {item.edificio}
            </Text>
          </View>
        )}

        {item.piso && (
          <View className="flex-row items-start">
            <Ionicons name="layers-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
            <Text className="text-slate-600 text-sm ml-2 flex-1">
              <Text className="font-semibold text-slate-700">Piso: </Text>
              {item.piso}
            </Text>
          </View>
        )}

        {item.direccion && (
          <View className="flex-row items-start">
            <Ionicons name="location-outline" size={16} color="#64748B" style={{ marginTop: 2 }} />
            <Text className="text-slate-600 text-sm ml-2 flex-1">
              <Text className="font-semibold text-slate-700">Dirección: </Text>
              {item.direccion}
            </Text>
          </View>
        )}
      </View>

      {/* Ver Ubicacion Button */}
      {item.direccion && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => handleOpenMaps(item.direccion!)}
          className="mt-4 bg-slate-50 border border-slate-200 py-2.5 rounded-xl flex-row items-center justify-center"
        >
          <Ionicons name="map-outline" size={18} color="#2563EB" />
          <Text className="text-blue-600 font-bold text-sm ml-2">
            Ver Ubicación
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ─── Render Empty State ──────────────────────────────────────────
  const renderEmptyState = () => {
    if (isLoading) return null;
    
    if (error) {
      return (
        <View className="flex-1 items-center justify-center py-20 px-6">
          <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text className="text-slate-900 font-bold text-lg mt-4 text-center">
            Error de conexión
          </Text>
          <Text className="text-slate-500 text-center text-sm mt-2">
            {error}
          </Text>
        </View>
      );
    }

    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
          <Ionicons name="search-outline" size={32} color="#94A3B8" />
        </View>
        <Text className="text-slate-900 font-bold text-lg mb-2 text-center">
          {searchQuery.trim() ? 'Sin resultados' : 'No hay juzgados'}
        </Text>
        <Text className="text-slate-500 text-center text-sm">
          {searchQuery.trim()
            ? `No se encontró ningún juzgado para "${searchQuery}".`
            : 'No se encontraron registros en la base de datos.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-black text-slate-900 tracking-tight">
          Juzgados
        </Text>
        <Text className="text-base text-slate-500 mt-1 font-medium">
          Directorio oficial
        </Text>
      </View>

      {/* Buscador Fijo */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-4 h-12 shadow-sm">
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por nombre o categoría..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-slate-900 text-base ml-3 h-full"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} className="p-1">
              <Ionicons name="close-circle" size={20} color="#CBD5E1" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading o Lista */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-medium mt-4">
            Cargando directorio...
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredJuzgados}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, paddingTop: 8, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
        />
      )}
    </SafeAreaView>
  );
}
