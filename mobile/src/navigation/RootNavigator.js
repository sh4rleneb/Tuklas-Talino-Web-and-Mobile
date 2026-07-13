import React, { useEffect, useState } from 'react';
import { ROLE_TITLES } from '../config/roleTitles';
import { getToken, api } from '../api/client';


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

import StudentTabNavigator
from './StudentTabNavigator';

import StudentSeniorTabNavigator
from './StudentSeniorTabNavigator';

import XPHistoryScreen
from '../screens/XPHistoryScreen';



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

function getHomeRouteForUser(user = {}) {
  if (user.role === 'student') {
    const gradeLevel = Number(user.student?.gradeLevel || 0);
    return gradeLevel <= 2 ? 'StudentTabs' : 'StudentSeniorTabs';
  }

  if (user.role === 'teacher') return 'TeacherHome';
  if (user.role === 'admin') return 'AdminHome';

  return 'Landing';
}


export default function RootNavigator() {

  const [booting, setBooting] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Landing');
  const [initialRouteParams, setInitialRouteParams] = useState(undefined);

  useEffect(() => {
    async function boot() {
      try {
        const token = await getToken();

        if (!token) {
          return;
        }

        const data = await api('/auth/me');
        const user = data.user;

        if (!user) {
          return;
        }
        const homeRoute = getHomeRouteForUser(user);

        if (user?.mustChangePassword) {
          setInitialRouteParams({ homeRoute });
          setInitialRoute('ChangePassword');
          return;
        }

        setInitialRouteParams(undefined);
        setInitialRoute(homeRoute);
      } catch (err) {
        void 0;
      } finally {
        setBooting(false);
      }
    }

    boot();
  }, []);

  if (booting) {
    return null;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={initialRoute}
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
          options={{
            title: ROLE_TITLES.StudentLogin
          }}
        />

        <Stack.Screen
          name="TeacherLogin"
          component={TeacherLogin}
          options={{
            title: ROLE_TITLES.TeacherLogin
          }}
        />

        <Stack.Screen
          name="AdminLogin"
          component={AdminLogin}
          options={{
            title: ROLE_TITLES.AdminLogin
          }}
        />

        <Stack.Screen
          name="ChangePassword"
          component={ChangePassword}
          initialParams={initialRoute === 'ChangePassword' ? initialRouteParams : undefined}
        />

        {/* STUDENT */}

        <Stack.Screen
          name="StudentTabs"
          component={StudentTabNavigator}
        />


          <Stack.Screen
            name="StudentSeniorTabs"
            component={StudentSeniorTabNavigator}
          />









        <Stack.Screen
          name="XPHistory"
          component={XPHistoryScreen}
        />
        

        <Stack.Screen
          name="TeacherHome"
          component={TeacherHome}
        />

        <Stack.Screen
          name="AdminHome"
          component={AdminHome}
        />



      </Stack.Navigator>
    </NavigationContainer>
  );
}
