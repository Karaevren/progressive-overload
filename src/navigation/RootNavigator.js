import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import RoutineDetailScreen from '../screens/RoutineDetailScreen';
import DayDetailScreen from '../screens/DayDetailScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={BottomTabs} />
      <Stack.Screen name="RoutineDetail" component={RoutineDetailScreen} />
      <Stack.Screen
        name="DayDetail"
        component={DayDetailScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
