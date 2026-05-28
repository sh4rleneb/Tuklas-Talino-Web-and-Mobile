import React from 'react';

import {
  createBottomTabNavigator,
} from '@react-navigation/bottom-tabs';

import {
  Ionicons,
} from '@expo/vector-icons';

import StudentJuniorHome
from '../screens/studentJunior/StudentJuniorHome';

import StudentSeniorHome
from '../screens/studentSenior/StudentSeniorHome';

const Tab =
  createBottomTabNavigator();

export default function StudentNavigator({
  route,
}) {

  const gradeLevel =
    route?.params?.gradeLevel || 1;

  const HomeScreen =
    gradeLevel <= 2
      ? StudentJuniorHome
      : StudentSeniorHome;

  return (

    <Tab.Navigator
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor:
          '#16A34A',

        tabBarStyle: {
          height: 70,
          paddingBottom: 10,
          borderTopWidth: 0,
          elevation: 8,
        },
      }}
    >

      <Tab.Screen
        name="Home"
        component={HomeScreen}

        options={{
          tabBarIcon: ({
            color,
            size,
          }) => (
            <Ionicons
              name="home"
              size={size}
              color={color}
            />
          ),
        }}
      />

    </Tab.Navigator>

  );
}