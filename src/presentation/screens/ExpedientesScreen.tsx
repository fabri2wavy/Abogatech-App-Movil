import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useExpedientes } from '../hooks/useExpedientes';
import { Expediente, getNombreCompletoCliente } from '../../domain/entities/Expediente';

export default function ExpedientesScreen() {
  const router = useRouter();
  const { casos, isLoading, isRefreshing, onRefresh } = useExpedientes();
  const [searchQuery, setSearchQuery] = useState('');
  
  // ─── Bottom Sheet Modal State (Standard RN) ───────────────────
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCaso, setSelectedCaso] = useState<Expediente | null>(null);

  const handlePresentModalPress = useCallback((caso: Expediente) => {
    console.log('--- CARD PRESSED ---', caso.titulo);
    setSelectedCaso(caso);
    setModalVisible(true);
  }, []);

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  const openWhatsApp = (phone?: string) => {
    if (!phone) {
      Alert.alert('Sin número', 'El cliente no tiene un número de teléfono registrado.');
      return;
    }
    // Removemos espacios, guiones o signos de más para limpiar el número
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `whatsapp://send?phone=${cleanPhone}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback a versión web si no tiene la app instalada
        Linking.openURL(`https://wa.me/${cleanPhone}`);
      }
    }).catch(() => {
      Alert.alert('Error', 'No se pudo abrir WhatsApp.');
    });
  };

  const filteredCasos = useMemo(() => {
    if (!searchQuery.trim()) return casos;
    const q = searchQuery.toLowerCase().trim();
    return casos.filter((c) => {
      const matchTitulo = c.titulo?.toLowerCase().includes(q);
      const matchNumero = c.numero_caso?.toLowerCase().includes(q);
      const matchNurej = c.nurej?.toLowerCase().includes(q);
      const nombreCliente = getNombreCompletoCliente(c.cliente)?.toLowerCase() || '';
      const matchCliente = nombreCliente.includes(q);
      return matchTitulo || matchNumero || matchNurej || matchCliente;
    });
  }, [casos, searchQuery]);

  // ─── Render Item ──────────────────────────────────────────────
  const renderItem = ({ item }: { item: Expediente }) => {
    // Determinar estilo según estado
    const getStatusStyle = (estado: string) => {
      const e = estado?.toLowerCase() || '';
      if (e.includes('activ') || e.includes('tramite')) return 'bg-emerald-100 text-emerald-700';
      if (e.includes('cerrad') || e.includes('archiv')) return 'bg-slate-200 text-slate-700';
      if (e.includes('espera')) return 'bg-amber-100 text-amber-700';
      return 'bg-blue-100 text-blue-700';
    };

    const statusClasses = getStatusStyle(item.estado).split(' ');
    const bgClass = statusClasses[0];
    const textClass = statusClasses[1];

    const displayNumero = item.nurej ? `NUREJ: ${item.nurej}` : (item.numero_caso || 'Sin Número');
    const displayCliente = getNombreCompletoCliente(item.cliente) || 'Cliente no asignado';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => handlePresentModalPress(item)}
        className="bg-white rounded-2xl p-5 mb-4 shadow-sm"
        style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2 }}
      >
        {/* Cabecera de Tarjeta */}
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider">
            {displayNumero}
          </Text>
          <View className={`px-3 py-1 rounded-full ${bgClass}`}>
            <Text className={`text-xs font-bold ${textClass}`}>
              {(item.estado || 'Desconocido').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Cuerpo */}
        <Text className="text-slate-900 font-bold text-lg mb-4" numberOfLines={2}>
          {item.titulo}
        </Text>

        {/* Pie */}
        <View className="flex-row items-center pt-3 border-t border-slate-100">
          <Ionicons name="person" size={16} color="#94A3B8" />
          <Text className="text-slate-600 text-sm font-medium ml-2" numberOfLines={1}>
            {displayCliente}
          </Text>
        </View>
      </TouchableOpacity>
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
      <View className="px-6 py-4">
        <View className="flex-row items-center bg-slate-100 rounded-2xl px-4 py-3">
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Buscar por cliente, título o NUREJ..."
            placeholderTextColor="#94A3B8"
            autoCapitalize="none"
            autoCorrect={false}
            className="flex-1 text-slate-900 text-base ml-3"
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

      {/* ─── Bottom Sheet (Standard RN Modal) ─────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View className="flex-1 justify-end bg-black/40">
          {/* Overlay clickeable para cerrar */}
          <TouchableOpacity 
            style={{ flex: 1 }} 
            activeOpacity={1} 
            onPress={handleCloseModal} 
          />
          
          {/* Contenedor del Sheet */}
          <View className="bg-white rounded-t-3xl shadow-2xl w-full max-h-[90%]" style={{ minHeight: '50%' }}>
            
            {/* Handle (La barrita superior decorativa) */}
            <View className="w-full items-center pt-4 pb-2">
              <View className="w-12 h-1.5 bg-slate-300 rounded-full" />
            </View>

            {selectedCaso && (
              <View className="px-6 pt-2 pb-8">
                <View className="mb-6">
                  <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">
                    {selectedCaso.nurej ? `NUREJ: ${selectedCaso.nurej}` : (selectedCaso.numero_caso || 'Sin Número')}
                  </Text>
                  <Text className="text-slate-900 font-bold text-2xl leading-tight mb-3">
                    {selectedCaso.titulo}
                  </Text>
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person" size={16} color="#64748B" />
                    <Text className="text-slate-600 text-sm font-medium ml-2">
                      Cliente: {getNombreCompletoCliente(selectedCaso.cliente) || 'No asignado'}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="information-circle" size={16} color="#64748B" />
                    <Text className="text-slate-600 text-sm font-medium ml-2">
                      Estado: {(selectedCaso.estado || 'Desconocido').toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <View className="bg-slate-100 rounded-xl p-4 mb-8">
                  {selectedCaso.materia && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="briefcase-outline" size={16} color="#64748B" />
                      <Text className="text-slate-600 text-sm ml-2">
                        Materia: <Text className="font-bold">{selectedCaso.materia}</Text>
                      </Text>
                    </View>
                  )}
                  <View className="flex-row items-center">
                    <Ionicons name="business-outline" size={16} color="#64748B" />
                    <Text className="text-slate-600 text-sm ml-2">
                      Juzgado: <Text className="font-bold">{selectedCaso.juzgado}</Text>
                    </Text>
                  </View>
                </View>

                {/* Botones de acción */}
                <View className="mt-auto pb-4">
                  <TouchableOpacity 
                    onPress={() => openWhatsApp(selectedCaso.cliente?.telefono)}
                    className="bg-[#25D366] rounded-xl py-4 flex-row justify-center items-center mb-3 shadow-sm"
                  >
                    <Ionicons name="logo-whatsapp" size={22} color="white" />
                    <Text className="text-white font-bold text-base ml-2">Contactar por WhatsApp</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    className="bg-slate-100 rounded-xl py-4 flex-row justify-center items-center"
                    onPress={() => {
                      handleCloseModal();
                      router.push(`/expediente/${selectedCaso.id}` as any);
                    }}
                  >
                    <Ionicons name="document-text" size={20} color="#475569" />
                    <Text className="text-slate-700 font-bold text-base ml-2">Ver Detalles del Caso</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
