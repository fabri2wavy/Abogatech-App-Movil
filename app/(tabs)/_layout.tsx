import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import CustomTabBar from '../../src/presentation/components/CustomTabBar';
import { useAuth } from '../../providers/authProvider';

export default function TabLayout() {
  const { userProfile, isLoading } = useAuth();
  const rol = userProfile?.rol;

  const esStaffLegal = ['admin', 'asociado_senior', 'abogado'].includes(rol || '');
  const esCliente = rol === 'cliente';

  // Compute hidden routes reactively based on role
  const hiddenRoutes = useMemo(() => {
    const hidden = new Set<string>();
    if (!esStaffLegal) {
      hidden.add('index');
      hidden.add('courts');
      hidden.add('assistant');
    }
    if (!esStaffLegal && !esCliente) {
      hidden.add('expedientes');
    }
    // 'profile' is always visible
    return hidden;
  }, [esStaffLegal, esCliente]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} hiddenRoutes={hiddenRoutes} />}
      screenOptions={{
        headerShown: false,
        tabBarHideOnKeyboard: true,
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="expedientes"
        options={{
          title: 'Casos',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'folder' : 'folder-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="courts"
        options={{
          title: 'Juzgados',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="assistant"
        options={{
          title: 'IA',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}