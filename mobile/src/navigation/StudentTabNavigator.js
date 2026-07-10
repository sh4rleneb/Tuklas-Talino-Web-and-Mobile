import React from 'react';
import { Text } from 'react-native';
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

const Tab = createBottomTabNavigator();

const STUDENT_TAB_LABELS = {
  Home: 'Tahanan',
  Lessons: 'Aralin',
  Quizzes: 'Pagsusulit',
  Missions: 'Misyon',
  Groups: 'Pangkat',
  Leaderboard: 'Ranggo',
  Badges: 'Gantimpala',
  Profile: 'Ako',
};

const STUDENT_TAB_ICONS = {
  Home: 'home',
  Lessons: 'book',
  Quizzes: 'help-circle',
  Missions: 'trophy',
  Groups: 'people',
  Leaderboard: 'podium',
  Badges: 'ribbon',
  Profile: 'person',
};

function StudentTabIcon({ routeName, focused, color }) {
  return (
    <Ionicons
      name={STUDENT_TAB_ICONS[routeName] || 'ellipse'}
      size={focused ? 24 : 22}
      color={color}
    />
  );
}

export default function StudentTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarLabel: ({ color }) => (
          <Text
            numberOfLines={1}
            allowFontScaling={false}
            style={{
              width: '100%',
              color,
              fontSize: 9,
              fontWeight: '900',
              letterSpacing: -0.35,
              marginTop: -2,
              textAlign: 'center',
            }}
          >
            {STUDENT_TAB_LABELS[route.name] || route.name}
          </Text>
        ),
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#16A34A',
        tabBarInactiveTintColor: '#64748B',
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: 'absolute',
          left: 4,
          right: 4,
          bottom: 12,
          height: 76,
          paddingTop: 8,
          paddingBottom: 10,
          borderRadius: 28,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 0,
          borderWidth: 1,
          borderColor: '#DCFCE7',
          shadowColor: '#14532D',
          shadowOpacity: 0.12,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 8,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarItemStyle: {
          borderRadius: 20,
          marginHorizontal: 0,
          paddingHorizontal: 0,
          paddingVertical: 4,
        },
        tabBarIcon: ({ focused, color }) => (
          <StudentTabIcon routeName={route.name} focused={focused} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Tahanan" component={StudentJuniorHome} />
      <Tab.Screen name="Mga Aralin" component={StudentLessonsStack} />
      <Tab.Screen name="Mga Pagsusulit" component={StudentQuizStack} />
      <Tab.Screen name="Mga Misyon" component={StudentMissionStack} />
      <Tab.Screen name="Mga Pangkat" component={StudentGroupsStack} />
      <Tab.Screen name="Mga Gantimpala" component={StudentBadgesStack} />
      <Tab.Screen name="Talaan ng Ranggo" component={StudentLeaderboardStack} />
      <Tab.Screen name="Ako" component={StudentProfileStack} />
    </Tab.Navigator>
  );
}
