import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MissionScreen from '../screens/MissionScreen';

const Stack = createNativeStackNavigator();

export default function StudentMissionStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="MissionHome"
        component={MissionScreen}
      />
    </Stack.Navigator>
  );
}