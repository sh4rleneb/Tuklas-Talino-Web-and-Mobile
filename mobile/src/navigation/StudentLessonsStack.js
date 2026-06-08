import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentJuniorLessons from '../screens/studentJunior/StudentJuniorLessons';
import StudentJuniorLessonDetail from '../screens/studentJunior/StudentJuniorLessonDetail';

const Stack = createNativeStackNavigator();

export default function StudentLessonsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="LessonsList"
        component={StudentJuniorLessons}
      />

      <Stack.Screen
        name="StudentJuniorLessonDetail"
        component={StudentJuniorLessonDetail}
      />
    </Stack.Navigator>
  );
}