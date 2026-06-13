import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import StudentSeniorHome from '../screens/studentSenior/StudentSeniorHome';
import StudentSeniorLessonsStack from './StudentSeniorLessonsStack';
import StudentQuizStack from './StudentQuizStack';
import StudentMissionStack from './StudentMissionStack';
import StudentGroupsStack from './StudentGroupsStack';
import StudentBadgesStack from './StudentBadgesStack';
import StudentProfileStack from './StudentProfileStack';

const Tab = createBottomTabNavigator();

export default function StudentSeniorTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#64748B',

        tabBarIcon: ({ color, size }) => {
          let iconName;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;

            case 'Lessons':
              iconName = 'book';
              break;

            case 'Quizzes':
              iconName = 'help-circle';
              break;

            case 'Missions':
              iconName = 'trophy';
              break;

            case 'Groups':
              iconName = 'people';
              break;

            case 'Badges':
              iconName = 'ribbon';
              break;

            case 'Profile':
              iconName = 'person';
              break;

            default:
              iconName = 'ellipse';
          }

          return (
            <Ionicons
              name={iconName}
              size={size}
              color={color}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Home" component={StudentSeniorHome} />
      <Tab.Screen name="Lessons" component={StudentSeniorLessonsStack} />
      <Tab.Screen name="Quizzes" component={StudentQuizStack} />
      <Tab.Screen name="Missions" component={StudentMissionStack} />
      <Tab.Screen name="Groups" component={StudentGroupsStack} />
      <Tab.Screen name="Badges" component={StudentBadgesStack} />
      <Tab.Screen name="Profile" component={StudentProfileStack} />
    </Tab.Navigator>
  );
}
