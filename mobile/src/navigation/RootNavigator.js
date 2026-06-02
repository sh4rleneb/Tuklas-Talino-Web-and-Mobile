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

import ChangePassword
from '../screens/auth/ChangePassword';

/*
STUDENT
*/

import StudentJuniorHome
from '../screens/studentJunior/StudentJuniorHome';

import StudentJuniorLessons
from '../screens/studentJunior/StudentJuniorLessons';

import StudentJuniorLessonDetail
from '../screens/studentJunior/StudentJuniorLessonDetail';

import ModulesScreen
from '../screens/studentJunior/ModulesScreen';

import QuizScreen
from '../screens/studentJunior/QuizScreen';

import GroupsScreen
from '../screens/GroupsScreen';

import BadgesScreen
from '../screens/BadgesScreen';

import ProfileScreen
from '../screens/ProfileScreen';

import MissionScreen
from '../screens/MissionScreen';

import StudentSeniorHome
from '../screens/studentSenior/StudentSeniorHome';

import StudentSeniorLessons
from '../screens/studentSenior/StudentSeniorLessons';


/*
TEACHER
*/

import TeacherHome
from '../screens/teacher/TeacherHome';

/*
ADMIN
*/

import AdminHome
from '../screens/admin/AdminHome';


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

        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
        />

        {/* STUDENT */}

        <Stack.Screen
          name="StudentJuniorHome"
          component={StudentJuniorHome}
        />

        <Stack.Screen
          name="StudentJuniorLessons"
          component={
            StudentJuniorLessons
          }
        />

        <Stack.Screen
          name="StudentJuniorLessonDetail"
          component={
            StudentJuniorLessonDetail
          }
        />

        <Stack.Screen
          name="ModulesScreen"
          component={ModulesScreen}
        />

        <Stack.Screen
          name="QuizScreen"
          component={QuizScreen}
        />

        <Stack.Screen
          name="GroupsScreen"
          component={GroupsScreen}
        />

        <Stack.Screen
          name="BadgesScreen"
          component={BadgesScreen}
        />

        <Stack.Screen
          name="MissionScreen"
          component={MissionScreen}
        />

        <Stack.Screen
          name="ProfileScreen"
          component={ProfileScreen}
        />
        

        <Stack.Screen
          name="TeacherHome"
          component={TeacherHome}
        />

        <Stack.Screen
          name="AdminHome"
          component={AdminHome}
        />

        <Stack.Screen
          name="StudentSeniorHome"
          component={StudentSeniorHome}
        />

        <Stack.Screen
          name="StudentSeniorLessons"
          component={
            StudentSeniorLessons
          }
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
