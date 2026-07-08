import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import StudentJuniorHome from '../screens/studentJunior/StudentJuniorHome';
import StudentLessonsStack from './StudentLessonsStack';
import StudentQuizStack from './StudentQuizStack';
import StudentMissionStack from './StudentMissionStack';
import StudentGroupsStack from './StudentGroupsStack';
import StudentBadgesStack from './StudentBadgesStack';
import StudentProfileStack from './StudentProfileStack';
import StudentLeaderboardStack from './StudentLeaderboardStack';

const Tab = createBottomTabNavigator(); const STUDENT_TAB_LABELS = {
  Home: 'Tahanan',
  Lessons: 'Aralin',
  Quizzes: 'Pagsusulit',
  Missions: 'Misyon',
  Groups: 'Pangkat',
  Leaderboard: 'Ranggo',
  Badges: 'Gantimpala',
  Profile: 'Ako',
};


export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
      tabBarLabel: STUDENT_TAB_LABELS[route.name] || route.name,
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

          case 'Leaderboard':
              iconName = 'podium';
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
      <Tab.Screen name="Home" component={StudentJuniorHome} />
      <Tab.Screen name="Lessons" component={StudentLessonsStack} />
      <Tab.Screen name="Quizzes" component={StudentQuizStack} />
      <Tab.Screen name="Missions" component={StudentMissionStack} />
      <Tab.Screen name="Groups" component={StudentGroupsStack} />
      <Tab.Screen name="Badges" component={StudentBadgesStack} />
      <Tab.Screen
        name="Leaderboard"
        component={StudentLeaderboardStack}
        options={{ tabBarLabel: 'Leaderboard' }}
      />
      <Tab.Screen name="Profile" component={StudentProfileStack} />
    </Tab.Navigator>
  );
}