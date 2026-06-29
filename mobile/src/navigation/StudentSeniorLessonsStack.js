import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import StudentSeniorLessons from '../screens/studentSenior/StudentSeniorLessons';
import StudentJuniorLessonDetail from '../screens/studentJunior/StudentJuniorLessonDetail';
import LessonDashboardScreen from '../screens/studentJunior/LessonDashboardScreen';

const Stack = createNativeStackNavigator();

export default function StudentSeniorLessonsStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="StudentSeniorLessonsHome"
        component={StudentSeniorLessons}
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
