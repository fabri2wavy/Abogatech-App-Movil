import React from 'react';
import { View, Text } from 'react-native';

export default function CalendarScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-slate-50">
      <Text className="text-slate-500 text-lg font-medium">
        Próximamente: Agenda
      </Text>
    </View>
  );
}