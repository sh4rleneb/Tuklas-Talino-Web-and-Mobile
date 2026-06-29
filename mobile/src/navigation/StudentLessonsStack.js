import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentJuniorLessons from '../screens/studentJunior/StudentJuniorLessons';
import StudentJuniorLessonDetail from '../screens/studentJunior/StudentJuniorLessonDetail';
import LessonDashboardScreen from '../screens/studentJunior/LessonDashboardScreen';

const Stack = createNativeStackNavigator();

export default function StudentLessonsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="LessonsList"
        component={StudentJuniorLessons}
      />

      <Stack.Screen
        name="LessonDashboardScreen"
        component={LessonDashboardScreen}
      />


      <Stack.Screen
        name="StudentJuniorLessonDetail"
        component={StudentJuniorLessonDetail}
      />
    </Stack.Navigator>
  );
}