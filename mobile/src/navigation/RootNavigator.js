import React from 'react';

import { NavigationContainer }
from '@react-navigation/native';

import { createNativeStackNavigator }
from '@react-navigation/native-stack';

/*
AUTH
*/

import LandingScreen
from '../screens/auth/LandingScreen';

import StudentLogin
from '../screens/auth/StudentLogin';

import TeacherLogin
from '../screens/auth/TeacherLogin';

import AdminLogin
from '../screens/auth/AdminLogin';

/*
STUDENT
*/

import StudentJuniorHome
from '../screens/studentJunior/StudentJuniorHome';

import StudentSeniorHome
from '../screens/studentSenior/StudentSeniorHome';

/*
TEACHER
*/

import TeacherNavigator
from './TeacherNavigator';

/*
ADMIN
*/

import AdminNavigator
from './AdminNavigator';

const Stack =
  createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Landing"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* LANDING */}

        <Stack.Screen
          name="Landing"
          component={LandingScreen}
        />

        {/* AUTH */}

        <Stack.Screen
          name="StudentLogin"
          component={StudentLogin}
        />

        <Stack.Screen
          name="TeacherLogin"
          component={TeacherLogin}
        />

        <Stack.Screen
          name="AdminLogin"
          component={AdminLogin}
        />

        {/* STUDENT */}

        <Stack.Screen
          name="StudentJuniorHome"
          component={StudentJuniorHome}
        />

        <Stack.Screen
          name="StudentSeniorHome"
          component={StudentSeniorHome}
        />

        {/* TEACHER */}

        <Stack.Screen
          name="TeacherHome"
          component={TeacherNavigator}
        />

        {/* ADMIN */}

        <Stack.Screen
          name="AdminHome"
          component={AdminNavigator}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}