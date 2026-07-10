import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { useExpedientes } from '../../src/presentation/hooks/useExpedientes';
import {
  type Expediente,
  getNombreCompletoCliente,
} from '../../src/domain/entities/Expediente';

// ─── Helpers de presentación (solo UI) ──────────────────────────

function formatRelativeDate(isoDate: string): string {
  const now = new Date();
  const date = new Date(isoDate);
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffMinutes < 1) return 'Justo ahora';
  if (diffMinutes < 60) return `Hace ${diffMinutes} min`;
  if (diffHours < 24) return `Hace ${diffHours}h`;
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffWeeks === 1) return 'Hace 1 semana';
  if (diffWeeks < 4) return `Hace ${diffWeeks} semanas`;
  if (diffMonths === 1) return 'Hace 1 mes';
  return `Hace ${diffMonths} meses`;
}

function getEstadoStyles(estado: string): { container: string; text: string; label: string } {
  switch (estado) {
    case 'activo':
      return { container: 'bg-blue-50 border-blue-200', text: 'text-blue-700', label: 'Activo' };
    case 'en_tramite':
      return { container: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'En Trámite' };
    case 'en_espera':
      return { container: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: 'En Espera' };
    case 'cerrado':
      return { container: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'Cerrado' };
    case 'archivado':
      return { container: 'bg-stone-100 border-stone-300', text: 'text-stone-600', label: 'Archivado' };
    default:
      return { container: 'bg-slate-100 border-slate-200', text: 'text-slate-600', label: estado };
  }
}

// ─── Componente (vista "tonta") ─────────────────────────────────

export default function MisExpedientesScreen() {
  const { casos, isLoading, isRefreshing, onRefresh } = useExpedientes();
  const [searchQuery, setSearchQuery] = useState('');

  // Filtro de búsqueda local
  const filteredCasos = useMemo(() => {
    if (!searchQuery.trim()) return casos;

    const q = searchQuery.toLowerCase().trim();
    return casos.filter((c) => {
      const matchTitulo = c.titulo.toLowerCase().includes(q);
      const nombreCliente = getNombreCompletoCliente(c.cliente);
      const matchCliente = nombreCliente?.toLowerCase().includes(q) ?? false;
      return matchTitulo || matchCliente;
    });
  }, [casos, searchQuery]);

  // ─── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-slate-50 items-center justify-center" edges={['top']}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-400 text-sm mt-4 font-medium">
          Cargando expedientes…
        </Text>
      </SafeAreaView>
    );
  }

  // ─── Tarjeta de expediente ──────────────────────────────────
  const renderItem = ({ item }: { item: Expediente }) => {
    const estadoStyles = getEstadoStyles(item.estado);
    const nombreCliente = getNombreCompletoCliente(item.cliente);

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        className="bg-white rounded-xl p-4 mb-4 border border-slate-200 shadow-sm"
      >
        {/* Título + Píldora */}
        <View className="flex-row justify-between items-start mb-2">
          <Text
            className="text-slate-900 font-bold text-lg flex-1 mr-4"
            numberOfLines={2}
          >
            {item.titulo}
          </Text>
          <View className={`px-2.5 py-1 rounded-full border ${estadoStyles.container}`}>
            <Text className={`text-xs font-semibold ${estadoStyles.text}`}>
              {estadoStyles.label}
            </Text>
          </View>
        </View>

        {/* Juzgado */}
        <View className="flex-row items-center mb-1.5">
          <Ionicons name="business-outline" size={16} color="#64748B" />
          <Text className="text-slate-500 text-sm ml-1.5 font-medium">
            {item.juzgado}
          </Text>
        </View>

        {/* Cliente */}
        {nombreCliente && (
          <View className="flex-row items-center mb-3">
            <Ionicons name="person-outline" size={16} color="#64748B" />
            <Text className="text-slate-500 text-sm ml-1.5 font-medium">
              {nombreCliente}
            </Text>
          </View>
        )}

        {/* Fecha + Chevron */}
        <View className="flex-row items-center justify-between border-t border-slate-100 pt-3 mt-1">
          <View className="flex-row items-center">
            <Ionicons name="time-outline" size={14} color="#94A3B8" />
            <Text className="text-slate-400 text-xs ml-1">
              {formatRelativeDate(item.fecha_actualizacion)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
        </View>
      </TouchableOpacity>
    );
  };

  // ─── Empty state ────────────────────────────────────────────
  const renderEmptyComponent = () => (
    <View className="flex-1 items-center justify-center py-20">
      <View className="w-16 h-16 rounded-full bg-slate-100 items-center justify-center mb-4">
        <Ionicons name="folder-open-outline" size={32} color="#94A3B8" />
      </View>
      <Text className="text-slate-900 font-bold text-lg mb-2">
        {searchQuery.trim() ? 'Sin resultados' : 'Sin expedientes activos'}
      </Text>
      <Text className="text-slate-500 text-center px-6">
        {searchQuery.trim()
          ? `No se encontraron expedientes para "${searchQuery}".`
          : 'No tienes casos asignados actualmente. Los nuevos expedientes aparecerán aquí.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header */}
      <View className="px-6 pt-6 pb-2">
        <Text className="text-3xl font-black text-slate-900 tracking-tight">
          Mis Expedientes
        </Text>
        <Text className="text-base text-slate-500 mt-1 font-medium">
          {casos.length} {casos.length === 1 ? 'caso activo' : 'casos activos'}
        </Text>
      </View>

      {/* Barra de búsqueda */}
      <View className="px-6 py-3">
        <View className="flex-row items-center bg-white rounded-xl border border-slate-200 px-4 h-12">
          <Ionicons name="search-outline" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por caso o cliente…"
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

      {/* Listado */}
      <FlatList
        data={filteredCasos}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#2563EB"
            colors={['#2563EB']}
          />
        }
      />
    </SafeAreaView>
  );
}