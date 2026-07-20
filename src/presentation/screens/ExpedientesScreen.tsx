import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpedientes } from '../hooks/useExpedientes';
import { Expediente, getNombreCompletoCliente } from '../../domain/entities/Expediente';

export default function ExpedientesScreen() {
  const { casos, isLoading, isRefreshing, onRefresh } = useExpedientes();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCasos = useMemo(() => {
    if (!searchQuery.trim()) return casos;
    const q = searchQuery.toLowerCase().trim();
    return casos.filter((c) => {
      const matchTitulo = c.titulo?.toLowerCase().includes(q);
      const matchNumero = c.numero_caso?.toLowerCase().includes(q);
      return matchTitulo || matchNumero;
    });
  }, [casos, searchQuery]);

  // ─── Render Item ──────────────────────────────────────────────
  const renderItem = ({ item }: { item: Expediente }) => {
    // Determinar estilo según estado (si el backend devuelve algo como 'activo', 'cerrado', etc.)
    const getStatusStyle = (estado: string) => {
      const e = estado?.toLowerCase() || '';
      if (e.includes('activ') || e.includes('tramite')) return 'bg-emerald-100 text-emerald-700';
      if (e.includes('cerrad') || e.includes('archiv')) return 'bg-slate-200 text-slate-700';
      if (e.includes('espera')) return 'bg-amber-100 text-amber-700';
      return 'bg-blue-100 text-blue-700';
    };

    return (
      <View className="bg-white rounded-2xl p-4 mb-4 border border-slate-200 shadow-sm">
        {/* Header de la tarjeta: Número y Estado */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-blue-600 font-bold text-sm">
            {item.numero_caso || 'Sin Número'}
          </Text>
          <View className={`px-2.5 py-1 rounded-full ${getStatusStyle(item.estado).split(' ')[0]}`}>
            <Text className={`text-xs font-bold ${getStatusStyle(item.estado).split(' ')[1]}`}>
              {(item.estado || 'Desconocido').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Título Principal */}
        <Text className="text-slate-900 font-bold text-lg mb-2" numberOfLines={2}>
          {item.titulo}
        </Text>

        {/* Detalles: Materia, Juzgado, NUREJ */}
        <View className="space-y-1.5 mt-2">
          {item.materia && (
            <View className="flex-row items-center">
              <Ionicons name="briefcase-outline" size={16} color="#64748B" />
              <Text className="text-slate-500 text-sm ml-2 font-medium">
                Materia: <Text className="text-slate-700">{item.materia}</Text>
              </Text>
            </View>
          )}

          <View className="flex-row items-center">
            <Ionicons name="business-outline" size={16} color="#64748B" />
            <Text className="text-slate-500 text-sm ml-2 font-medium" numberOfLines={1}>
              Juzgado: <Text className="text-slate-700">{item.juzgado}</Text>
            </Text>
          </View>

          {item.nurej && (
            <View className="flex-row items-center">
              <Ionicons name="document-text-outline" size={16} color="#64748B" />
              <Text className="text-slate-500 text-sm ml-2 font-medium">
                NUREJ: <Text className="text-slate-700">{item.nurej}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Cliente (Opcional si viene) */}
        {getNombreCompletoCliente(item.cliente) && (
          <View className="flex-row items-center mt-3 pt-3 border-t border-slate-100">
            <Ionicons name="person-outline" size={14} color="#94A3B8" />
            <Text className="text-slate-400 text-xs ml-1.5 font-medium">
              Cliente: {getNombreCompletoCliente(item.cliente)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  // ─── Render Empty State ───────────────────────────────────────
  const renderEmptyState = () => {
    if (isLoading) return null; // Previene flash al cargar
    
    return (
      <View className="flex-1 items-center justify-center py-20 px-6">
        <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
          <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
        </View>
        <Text className="text-slate-900 font-bold text-lg mb-2 text-center">
          {searchQuery.trim() ? 'No hay resultados' : 'Sin casos activos'}
        </Text>
        <Text className="text-slate-500 text-center text-sm">
          {searchQuery.trim()
            ? `No encontramos casos que coincidan con "${searchQuery}". Intenta con otros términos.`
            : 'No tienes expedientes asignados actualmente. Los nuevos casos aparecerán aquí.'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-black text-slate-900 tracking-tight">
          Expedientes Activos
        </Text>
      </View>

      {/* Buscador */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-4 h-12">
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por título o número de caso..."
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
      {isLoading && !isRefreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#2563EB" />
          <Text className="text-slate-400 font-medium mt-4">Cargando expedientes...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCasos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor="#2563EB"
              colors={['#2563EB']}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}
