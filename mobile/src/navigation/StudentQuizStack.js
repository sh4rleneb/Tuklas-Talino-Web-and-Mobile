import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import QuizScreen from '../screens/studentJunior/QuizScreen';

const Stack = createNativeStackNavigator();

export default function StudentQuizStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="QuizHome"
        component={QuizScreen}
      />
    </Stack.Navigator>
  );
}