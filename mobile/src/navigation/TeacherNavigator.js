import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import TeacherDashboard from '../screens/teacher/TeacherDashboard';

const Stack = createNativeStackNavigator();

export default function TeacherNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="TeacherDashboard"
        component={TeacherDashboard}
      />
    </Stack.Navigator>
  );
}