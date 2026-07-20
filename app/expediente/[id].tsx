import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, FlatList, Dimensions, Modal, TextInput, Switch, KeyboardAvoidingView, Platform, Linking } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useExpedienteDetalle } from '../../src/presentation/hooks/useExpedienteDetalle';

const { width } = Dimensions.get('window');

const TABS = [
  { id: 'info', label: 'Información', icon: 'information-circle-outline' as const },
  { id: 'docs', label: 'Documentos', icon: 'document-text-outline' as const },
  { id: 'bitacora', label: 'Bitácora', icon: 'journal-outline' as const },
  { id: 'avance', label: 'Avance', icon: 'git-commit-outline' as const },
  { id: 'gastos', label: 'Gastos', icon: 'receipt-outline' as const },
];

export default function ExpedienteDetalleScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data, isLoading, agregarNota, agregarGasto, agregarDocumento } = useExpedienteDetalle(id);
  const [activeTab, setActiveTab] = useState('info');
  
  // States para Formularios
  const [isGastoModalVisible, setGastoModalVisible] = useState(false);
  const [nuevaNota, setNuevaNota] = useState('');
  const [isSubmittingNota, setIsSubmittingNota] = useState(false);
  const [isSubmittingGasto, setIsSubmittingGasto] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  
  const todayISO = new Date().toISOString().split('T')[0];
  const [nuevoGasto, setNuevoGasto] = useState({ concepto: '', monto: '', reembolsado: false, observaciones: '', fecha: todayISO });

  if (isLoading || !data) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#2563EB" />
        <Text className="text-slate-500 mt-4">Cargando expediente...</Text>
      </View>
    );
  }

  // Render helpers para cada pestaña
  const renderInfo = () => (
    <View className="p-6">
      <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Estado Actual</Text>
        <View className="flex-row items-center">
          <View className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
          <Text className="text-emerald-700 font-bold text-base">En Trámite</Text>
        </View>
      </View>
      
      <View className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-4">
        <Text className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-4">Detalles Técnicos</Text>
        
        <View className="mb-4">
          <Text className="text-slate-400 text-sm mb-1">Materia</Text>
          <Text className="text-slate-900 font-medium">Derecho Civil</Text>
        </View>
        <View className="mb-4">
          <Text className="text-slate-400 text-sm mb-1">Juzgado Asignado</Text>
          <TouchableOpacity onPress={() => {
            const query = encodeURIComponent('Juzgado Público Civil 1, Bolivia');
            const url = Platform.OS === 'ios' ? `maps:0,0?q=${query}` : `geo:0,0?q=${query}`;
            Linking.openURL(url).catch(() => alert('No se pudo abrir los mapas.'));
          }} className="flex-row items-center">
            <Ionicons name="location" size={16} color="#2563EB" className="mr-1" />
            <Text className="text-blue-600 font-bold ml-1">Juzgado Público Civil 1</Text>
          </TouchableOpacity>
        </View>
        <View>
          <Text className="text-slate-400 text-sm mb-1">Abogado a Cargo</Text>
          <Text className="text-slate-900 font-medium">Martin Iturri</Text>
        </View>
      </View>
    </View>
  );

  const renderDocs = () => (
    <View className="p-6">
      <TouchableOpacity 
        className={`rounded-xl py-4 flex-row justify-center items-center mb-6 shadow-sm ${isUploadingDoc ? 'bg-slate-400' : 'bg-slate-900'}`}
        disabled={isUploadingDoc}
        onPress={async () => {
          try {
            const permission = await ImagePicker.requestCameraPermissionsAsync();
            if (!permission.granted) {
              alert('Se requiere permiso de cámara para escanear documentos.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ['images'],
              quality: 0.8,
            });
            if (!result.canceled) {
              setIsUploadingDoc(true);
              await agregarDocumento(result.assets[0].uri);
              alert('Documento guardado exitosamente.');
            }
          } catch (error: any) {
            alert('Error al subir documento: ' + error.message);
          } finally {
            setIsUploadingDoc(false);
          }
        }}
      >
        {isUploadingDoc ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Ionicons name="camera" size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">Fotografiar Documento</Text>
          </>
        )}
      </TouchableOpacity>

      {data.documentos.map((doc: any) => (
        <TouchableOpacity key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3 flex-row items-center">
          <View className="bg-red-50 w-10 h-10 rounded-lg items-center justify-center mr-4">
            <Ionicons name="document" size={20} color="#DC2626" />
          </View>
          <View className="flex-1">
            <Text className="text-slate-900 font-bold text-sm mb-1">{doc.nombre}</Text>
            <Text className="text-slate-400 text-xs">{doc.fecha} • {doc.size}</Text>
          </View>
          <Ionicons name="download-outline" size={20} color="#64748B" />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderBitacora = () => (
    <View className="flex-1">
      <ScrollView className="p-6 flex-1">
        <View className="mb-4">
          <Text className="text-slate-500 text-sm mb-2">Estas notas son visibles para el cliente.</Text>
        </View>
        {data.bitacora.map((nota: any) => (
          <View key={nota.id} className="bg-amber-50 p-4 rounded-xl shadow-sm border border-amber-200 mb-3">
            <View className="flex-row justify-between mb-2">
              <Text className="text-amber-800 font-bold text-xs">{nota.creado_por_nombre}</Text>
              <Text className="text-amber-600 text-xs">{nota.fecha}</Text>
            </View>
            <Text className="text-slate-800 text-base leading-relaxed">{nota.contenido}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Caja de entrada estilo Chat */}
      <View className="p-4 bg-white border-t border-slate-100 flex-row items-center pb-8">
        <TextInput
          value={nuevaNota}
          onChangeText={setNuevaNota}
          placeholder="Escribe una nueva nota..."
          placeholderTextColor="#94A3B8"
          className="flex-1 bg-slate-100 rounded-full px-5 py-3 text-slate-900 mr-3"
          multiline
        />
        <TouchableOpacity 
          className={`rounded-full w-12 h-12 items-center justify-center shadow-sm ${isSubmittingNota || !nuevaNota.trim() ? 'bg-slate-400' : 'bg-blue-600'}`}
          disabled={isSubmittingNota || !nuevaNota.trim()}
          onPress={async () => {
            if (nuevaNota.trim()) {
              try {
                setIsSubmittingNota(true);
                await agregarNota(nuevaNota.trim());
                setNuevaNota('');
              } catch (error: any) {
                alert('Error al guardar nota: ' + error.message);
              } finally {
                setIsSubmittingNota(false);
              }
            }
          }}
        >
          {isSubmittingNota ? (
            <ActivityIndicator color="white" />
          ) : (
            <Ionicons name="send" size={20} color="white" className="ml-1" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderAvance = () => (
    <View className="p-6">
      {data.avances.map((avance: any, index: number) => (
        <View key={avance.id} className="flex-row mb-6">
          <View className="items-center mr-4">
            <View className={`w-8 h-8 rounded-full items-center justify-center ${avance.estado === 'completado' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
              <Ionicons name={avance.estado === 'completado' ? 'checkmark' : 'time'} size={16} color={avance.estado === 'completado' ? '#059669' : '#64748B'} />
            </View>
            {index !== data.avances.length - 1 && (
              <View className="w-0.5 h-full bg-slate-200 mt-2" />
            )}
          </View>
          <View className="flex-1 pt-1 pb-4">
            <Text className="text-slate-400 text-xs mb-1">{avance.fecha}</Text>
            <Text className="text-slate-900 font-bold text-base mb-1">{avance.titulo}</Text>
            <Text className="text-slate-600 text-sm">{avance.detalle}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  const renderGastos = () => (
    <View className="p-6 pb-24">
      <TouchableOpacity 
        className="bg-slate-900 rounded-xl py-4 flex-row justify-center items-center mb-6 shadow-sm"
        onPress={() => setGastoModalVisible(true)}
      >
        <Ionicons name="add-circle" size={20} color="white" />
        <Text className="text-white font-bold text-base ml-2">Registrar Gasto Operativo</Text>
      </TouchableOpacity>

      <Text className="text-slate-900 font-bold text-lg mb-4">Historial de Gastos</Text>
      {data.gastos_operativos.map((gasto: any) => (
        <View key={gasto.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 mb-3">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 pr-2">
              <Text className="text-slate-900 font-bold text-base mb-1">{gasto.concepto}</Text>
              <Text className="text-slate-400 text-xs">{gasto.fecha}</Text>
            </View>
            <Text className="text-slate-900 font-black text-lg text-right">Bs. {gasto.monto}</Text>
          </View>
          
          {gasto.observaciones && (
            <Text className="text-slate-500 text-sm italic mb-3">"{gasto.observaciones}"</Text>
          )}

          <View className="flex-row items-center justify-between mt-2 pt-2 border-t border-slate-100">
            <View className="flex-row items-center">
              <View className={`w-2 h-2 rounded-full mr-2 ${gasto.reembolsado ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <Text className={`text-xs font-bold uppercase tracking-wider ${gasto.reembolsado ? 'text-emerald-600' : 'text-amber-600'}`}>
                {gasto.reembolsado ? 'Reembolsado' : 'Pendiente'}
              </Text>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top']}>
      {/* Header Fijo */}
      <View className="px-6 pt-4 pb-4 bg-white border-b border-slate-100 shadow-sm z-10">
        <View className="flex-row items-center mb-4">
          <TouchableOpacity onPress={() => router.back()} className="flex-row items-center">
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
            <Text className="text-slate-900 font-medium ml-2">Volver</Text>
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">NUREJ: 2034567</Text>
        <Text className="text-slate-900 font-black text-2xl leading-tight mb-2">Demanda Ejecutiva - Banco Bisa</Text>
        <View className="flex-row items-center">
          <Ionicons name="person" size={14} color="#64748B" />
          <Text className="text-slate-600 text-sm ml-1.5">Martin Iturri Peters</Text>
        </View>
      </View>

      {/* Selector de Pestañas (Horizontal Scroll) */}
      <View className="bg-white border-b border-slate-200">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                className={`flex-row items-center px-4 py-4 mr-2 border-b-2 ${isActive ? 'border-blue-600' : 'border-transparent'}`}
              >
                <Ionicons name={tab.icon} size={18} color={isActive ? '#2563EB' : '#64748B'} />
                <Text className={`ml-2 font-bold ${isActive ? 'text-blue-600' : 'text-slate-500'}`}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Contenido Dinámico */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {activeTab === 'info' && <ScrollView showsVerticalScrollIndicator={false}>{renderInfo()}</ScrollView>}
        {activeTab === 'docs' && <ScrollView showsVerticalScrollIndicator={false}>{renderDocs()}</ScrollView>}
        {activeTab === 'bitacora' && renderBitacora()}
        {activeTab === 'avance' && <ScrollView showsVerticalScrollIndicator={false}>{renderAvance()}</ScrollView>}
        {activeTab === 'gastos' && <ScrollView showsVerticalScrollIndicator={false}>{renderGastos()}</ScrollView>}
      </KeyboardAvoidingView>

      {/* Modal para Registrar Gasto */}
      <Modal
        visible={isGastoModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setGastoModalVisible(false)}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 justify-end bg-black/40">
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setGastoModalVisible(false)} activeOpacity={1} />
          
          <View className="bg-white rounded-t-3xl shadow-2xl p-6" style={{ minHeight: '60%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <View className="flex-row items-center">
                <Ionicons name="receipt" size={24} color="#DC2626" />
                <Text className="text-slate-900 font-black text-xl ml-2">Registrar Gasto</Text>
              </View>
              <TouchableOpacity onPress={() => setGastoModalVisible(false)}>
                <Ionicons name="close" size={28} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <View className="mb-4">
              <Text className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-wider">Concepto</Text>
              <TextInput
                value={nuevoGasto.concepto}
                onChangeText={(t) => setNuevoGasto({...nuevoGasto, concepto: t})}
                placeholder="Ej: Fotocopias legalizadas"
                placeholderTextColor="#94A3B8"
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base"
              />
            </View>

            <View className="flex-row mb-4 space-x-4">
              <View className="flex-1">
                <Text className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-wider">Monto (Bs)</Text>
                <TextInput
                  value={nuevoGasto.monto}
                  onChangeText={(t) => setNuevoGasto({...nuevoGasto, monto: t})}
                  placeholder="0.00"
                  keyboardType="numeric"
                  placeholderTextColor="#94A3B8"
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base"
                />
              </View>
              <View className="flex-1">
                <Text className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-wider">Fecha</Text>
                <View className="bg-white border border-slate-200 rounded-xl px-4 py-3 flex-row justify-between items-center">
                  <Text className="text-slate-900 text-base">{nuevoGasto.fecha}</Text>
                  <Ionicons name="calendar-outline" size={20} color="#64748B" />
                </View>
              </View>
            </View>

            <View className="flex-row items-center mb-6 pt-2 pb-2">
              <Switch
                value={nuevoGasto.reembolsado}
                onValueChange={(v) => setNuevoGasto({...nuevoGasto, reembolsado: v})}
                trackColor={{ false: '#CBD5E1', true: '#10B981' }}
                thumbColor="#FFFFFF"
              />
              <Text className={`ml-3 font-bold text-base ${nuevoGasto.reembolsado ? 'text-emerald-600' : 'text-slate-500'}`}>
                {nuevoGasto.reembolsado ? 'Reembolsado' : 'No reembolsado'}
              </Text>
            </View>

            <View className="mb-8">
              <Text className="text-slate-500 font-bold text-xs uppercase mb-2 tracking-wider">Observaciones</Text>
              <TextInput
                value={nuevoGasto.observaciones}
                onChangeText={(t) => setNuevoGasto({...nuevoGasto, observaciones: t})}
                placeholder="Detalles adicionales del gasto..."
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
                className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-base h-24"
                style={{ textAlignVertical: 'top' }}
              />
            </View>

            <View className="flex-row justify-end border-t border-slate-100 pt-4">
              <TouchableOpacity 
                className="px-6 py-3 border border-slate-200 rounded-xl mr-3"
                onPress={() => setGastoModalVisible(false)}
              >
                <Text className="text-slate-600 font-bold text-base">Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className={`px-6 py-3 rounded-xl flex-row items-center ${isSubmittingGasto ? 'bg-slate-400' : 'bg-slate-900'}`}
                disabled={isSubmittingGasto || !nuevoGasto.concepto || !nuevoGasto.monto}
                onPress={async () => {
                  if (!nuevoGasto.concepto || !nuevoGasto.monto) {
                    alert('Concepto y Monto son requeridos.');
                    return;
                  }
                  try {
                    setIsSubmittingGasto(true);
                    await agregarGasto({
                      ...nuevoGasto,
                      monto: parseFloat(nuevoGasto.monto)
                    });
                    setNuevoGasto({ concepto: '', monto: '', reembolsado: false, observaciones: '', fecha: todayISO });
                    setGastoModalVisible(false);
                  } catch (error: any) {
                    alert('Error al registrar gasto: ' + error.message);
                  } finally {
                    setIsSubmittingGasto(false);
                  }
                }}
              >
                {isSubmittingGasto ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Ionicons name="receipt-outline" size={18} color="#DC2626" className="mr-2" />
                    <Text className="text-white font-bold text-base ml-2">Registrar Gasto</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
