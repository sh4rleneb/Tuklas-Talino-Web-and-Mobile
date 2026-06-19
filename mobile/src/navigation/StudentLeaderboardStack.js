import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LeaderboardScreen from '../screens/LeaderboardScreen';

const Stack = createNativeStackNavigator();

export default function StudentLeaderboardStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown:false }}>
      <Stack.Screen
        name="LeaderboardHome"
        component={LeaderboardScreen}
      />
    </Stack.Navigator>
  );
}
