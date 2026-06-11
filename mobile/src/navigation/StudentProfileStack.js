import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import ProfileScreen from '../screens/ProfileScreen';
import XPHistoryScreen from '../screens/XPHistoryScreen';

const Stack = createNativeStackNavigator();

export default function StudentProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
      />

      <Stack.Screen
        name="XPHistory"
        component={XPHistoryScreen}
      />
    </Stack.Navigator>
  );
}