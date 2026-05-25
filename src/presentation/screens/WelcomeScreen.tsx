import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Text, TouchableOpacity, View } from 'react-native';

export function WelcomeScreen() {
    const router = useRouter();
    const [isSplash, setIsSplash] = useState(true);
    const fadeAnim = useState(new Animated.Value(1))[0];

    useEffect(() => {
        const timer = setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }).start(() => {
                setIsSplash(false);
                Animated.timing(fadeAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true,
                }).start();
            });
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    // --- ESTADO 1: SPLASH SCREEN ---
    if (isSplash) {
        return (
            // Fondo blanco puro con texto e íconos en Azul Rey
            <Animated.View style={{ opacity: fadeAnim }} className="flex-1 bg-white items-center justify-center">
                <View className="w-24 h-24 rounded-3xl bg-blue-50 border border-blue-100 items-center justify-center mb-6 shadow-sm">
                    <Ionicons name="scale" size={56} color="#2563EB" />
                </View>
                <Text className="text-slate-900 text-4xl font-extrabold tracking-widest">
                    ABOGATECH
                </Text>
            </Animated.View>
        );
    }

    // --- ESTADO 2: PANTALLA DE BIENVENIDA ---
    return (
        <Animated.View style={{ opacity: fadeAnim }} className="flex-1 bg-white justify-between px-6 py-12">
            <View className="flex-1 justify-center items-center">
                <View className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 items-center justify-center mb-8 shadow-sm">
                    <Ionicons name="scale" size={32} color="#2563EB" />
                </View>

                <Text className="text-blue-600 text-lg font-bold uppercase tracking-widest mb-4">
                    Abogatech
                </Text>

                <Text className="text-slate-900 text-4xl font-black text-center leading-tight mb-6">
                    Tu ecosistema legal de alto rendimiento
                </Text>

                <Text className="text-slate-500 text-base text-center leading-relaxed px-4 font-medium">
                    Inteligencia y precisión para gestionar tu despacho. Toma el control de tus procesos legales desde cualquier lugar.
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                // Fondo azul corporativo y al presionar cambia a un azul más oscuro
                className="w-full h-16 bg-blue-600 rounded-2xl flex-row items-center justify-center active:bg-blue-800 shadow-md shadow-blue-200 transition-colors"
            >
                <Text className="text-white text-lg font-bold tracking-wide mr-2">
                    Comenzar
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}