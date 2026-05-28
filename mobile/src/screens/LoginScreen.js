import React, { useState } from 'react';
import { Text, TextInput, View, StyleSheet, Alert } from 'react-native';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { useAuth } from '../context/AuthContext';
import { colors } from '../styles/theme';

const samples = {
  student: ['STU-2025-001', 'student123'],
  teacher: ['teacher1', 'teach123'],
  admin: ['admin', 'admin123']
};

export default function LoginScreen({ route }) {
  const role = route.params?.role || 'student';
  const [identifier, setIdentifier] = useState(samples[role][0]);
  const [password, setPassword] = useState(samples[role][1]);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  async function submit() {
    setLoading(true);
    try {
      await login(role, identifier, password);
    } catch (err) {
      Alert.alert('Login failed', err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.screen}>
      <Card>
        <Text style={styles.icon}>{role === 'student' ? '🧒' : role === 'teacher' ? '👩‍🏫' : '🛡️'}</Text>
        <Text style={styles.title}>{role.toUpperCase()} Login</Text>
        <TextInput style={styles.input} value={identifier} onChangeText={setIdentifier} placeholder="ID or username" autoCapitalize="none" />
        <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="Password" secureTextEntry />
        <PrimaryButton onPress={submit}>{loading ? 'Signing in...' : 'Login'}</PrimaryButton>
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 18, justifyContent: 'center' },
  icon: { fontSize: 52, textAlign: 'center' },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink, textAlign: 'center', marginBottom: 16 },
  input: { backgroundColor: '#fff', borderColor: '#edf0f7', borderWidth: 2, borderRadius: 16, padding: 13, marginBottom: 10 }
});
