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
            <Animated.View style={{ opacity: fadeAnim }} className="flex-1 bg-[#FFFFFF] items-center justify-center">
                <View className="w-24 h-24 rounded-3xl bg-[#1D4ED8]/20 items-center justify-center mb-6">
                    <Ionicons name="briefcase" size={56} color="#3B82F6" />
                </View>
                <Text className="text-black text-4xl font-extrabold tracking-widest">
                    ABOGATECH
                </Text>
            </Animated.View>
        );
    }

    // --- ESTADO 2: PANTALLA DE BIENVENIDA ---
    return (
        <Animated.View style={{ opacity: fadeAnim }} className="flex-1 bg-[#FFFFFF] justify-between px-6 py-12">
            <View className="flex-1 justify-center items-center">
                <View className="w-16 h-16 rounded-2xl bg-[#1D4ED8]/20 items-center justify-center mb-8">
                    <Ionicons name="briefcase" size={32} color="#3B82F6" />
                </View>

                <Text className="text-[#3B82F6] text-lg font-semibold uppercase tracking-widest mb-4">
                    Abogatech
                </Text>

                <Text className="text-black text-4xl font-bold text-center leading-tight mb-6">
                    Tu ecosistema legal de alto rendimiento
                </Text>

                <Text className="text-slate-400 text-base text-center leading-relaxed px-4">
                    Inteligencia y precisión para gestionar tu despacho. Toma el control de tus procesos legales desde cualquier lugar.
                </Text>
            </View>

            <TouchableOpacity
                onPress={() => router.push('/auth/login')}
                className="w-full h-16 bg-[#1D4ED8] rounded-2xl flex-row items-center justify-center active:bg-[#6D28D9]"
            >
                <Text className="text-white text-lg font-bold tracking-wide mr-2">
                    Comenzar
                </Text>
                <Ionicons name="arrow-forward" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </Animated.View>
    );
}