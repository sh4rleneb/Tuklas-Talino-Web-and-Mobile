import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { changePassword, logout } from '../../api/auth';

export default function ChangePassword({ navigation, route }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const homeRoute = route.params?.homeRoute || 'Landing';

  async function handleSubmit() {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Missing Fields', 'Please complete all password fields.');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Password Too Short', 'Your new password must have at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please enter the same new password twice.');
      return;
    }

    try {
      setLoading(true);
      await changePassword(currentPassword, newPassword);
      Alert.alert('Password Updated', 'Your new password is ready to use.');
      navigation.reset({
        index: 0,
        routes: [{ name: homeRoute }],
      });
    } catch (error) {
      Alert.alert('Password Change Failed', error.message || 'Unable to update your password.');
    } finally {
      setLoading(false);
    }
  }

  async function handleLogout() {
    await logout();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Landing' }],
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.safe}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Change Your Password</Text>
          <Text style={styles.subtitle}>
            Your temporary password worked. Create a private password before opening your dashboard.
          </Text>

          <Text style={styles.label}>Current password</Text>
          <TextInput
            style={styles.input}
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>New password</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <Text style={styles.label}>Confirm new password</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
          />

          <TouchableOpacity style={styles.primaryButton} onPress={handleSubmit} disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.primaryText}>Save New Password</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={loading}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
  icon: {
    fontSize: 42,
    marginBottom: 12,
  },
  title: {
    color: '#0F172A',
    fontSize: 26,
    fontWeight: '800',
  },
  subtitle: {
    color: '#475569',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
    marginTop: 8,
  },
  label: {
    color: '#334155',
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#16A34A',
    borderRadius: 14,
    marginTop: 24,
    paddingVertical: 15,
  },
  primaryText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  logoutButton: {
    alignItems: 'center',
    marginTop: 10,
    paddingVertical: 13,
  },
  logoutText: {
    color: '#64748B',
    fontWeight: '700',
  },
});
