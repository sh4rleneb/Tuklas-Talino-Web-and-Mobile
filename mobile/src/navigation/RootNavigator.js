import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { ActivityIndicator, View, Text } from 'react-native';
import { useAuth } from '../context/AuthContext';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import StudentHomeScreen from '../screens/StudentHomeScreen';
import LessonsScreen from '../screens/LessonsScreen';
import LessonDetailScreen from '../screens/LessonDetailScreen';
import GroupsScreen from '../screens/GroupsScreen';
import BadgesScreen from '../screens/BadgesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PlaceholderScreen from '../screens/PlaceholderScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={StudentHomeScreen} options={{ tabBarIcon: () => <Text>🏠</Text> }} />
      <Tab.Screen name="Lessons" component={LessonsScreen} options={{ tabBarIcon: () => <Text>📚</Text> }} />
      <Tab.Screen name="Groups" component={GroupsScreen} options={{ tabBarIcon: () => <Text>🤝</Text> }} />
      <Tab.Screen name="Badges" component={BadgesScreen} options={{ tabBarIcon: () => <Text>🏅</Text> }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ tabBarIcon: () => <Text>🙂</Text> }} />
    </Tab.Navigator>
  );
}

export default function RootNavigator() {
  const { user, booting } = useAuth();

  if (booting) {
    return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator /></View>;
  }

  return (
    <Stack.Navigator>
      {!user ? (
        <>
          <Stack.Screen name="Landing" component={LandingScreen} options={{ title: 'Tuklas Talino' }} />
          <Stack.Screen name="Login" component={LoginScreen} />
        </>
      ) : user.role === 'student' ? (
        <>
          <Stack.Screen name="StudentTabs" component={StudentTabs} options={{ headerShown: false }} />
          <Stack.Screen name="LessonDetail" component={LessonDetailScreen} options={{ title: 'Lesson' }} />
        </>
      ) : (
        <Stack.Screen name="RolePlaceholder" component={PlaceholderScreen} options={{ title: user.role === 'teacher' ? 'Teacher' : 'Admin' }} />
      )}
    </Stack.Navigator>
  );
}
