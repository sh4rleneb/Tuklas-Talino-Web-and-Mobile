import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import PrimaryButton from '../components/PrimaryButton';
import Card from '../components/Card';
import { colors } from '../styles/theme';

export default function PlaceholderScreen() {
  const { user, logout } = useAuth();
  return (
    <View style={styles.screen}>
      <Card>
        <Text style={styles.title}>{user?.role === 'teacher' ? 'Teacher' : 'Admin'} Mobile Shell</Text>
        <Text style={styles.text}>
          Student mobile screens are implemented. Teacher/admin mobile views are scaffolded here and use the same API, ready for expansion.
        </Text>
        <PrimaryButton variant="secondary" onPress={logout}>Logout</PrimaryButton>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16, justifyContent: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink, marginBottom: 8 },
  text: { color: colors.muted, lineHeight: 22 }
});
