import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import BadgesScreen from '../screens/BadgesScreen';

const Stack = createNativeStackNavigator();

export default function StudentBadgesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="BadgesHome"
        component={BadgesScreen}
      />
    </Stack.Navigator>
  );
}