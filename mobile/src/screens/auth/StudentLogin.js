import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { api, setToken } from '../../api/client';
function sanitizeStudentLoginIdInput(value) {
  return String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9-]/g, '')
    .toUpperCase();
}

function cleanStudentLoginPasswordInput(value) {
  return String(value || '').replace(/\s+/g, '');
}

export default function StudentLogin({
  navigation,
}) {

  const [studentId, setStudentId] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);
function handleStudentIdChange(value) {
    const upper = sanitizeStudentLoginIdInput(value);
    setStudentId(upper);
  }

  async function handleLogin() {

    if (loading) return;

    try {

      if (!studentId || !password) {
        Alert.alert(
          'May Kulang',
          'Pakilagay ang wastong Mag-aaral ID at password.'
        );

        return;
      }

      setLoading(true);

      const cleanedStudentId = studentId.trim();
      const cleanedPassword = password;

      const data = await api(
        '/auth/login',
        {
          method: 'POST',
          body: {
            role: 'student',
            identifier: cleanedStudentId,
            password: cleanedPassword,
          },
        }
      );

      const user = data.user;

      if (!user) {
        Alert.alert(
          'Hindi Makapasok',
          'Hindi makita ang impormasyon ng mag-aaral.'
        );

        return;
      }

      await setToken(data.token);

      const gradeLevel = Number(
        user.student?.gradeLevel
      );

      /*
        Baitang 1-2 = Junior tabs
        Baitang 3-6 = Senior tabs
      */

      const homeRoute = gradeLevel <= 2
        ? 'StudentTabs'
        : 'StudentSeniorTabs';

      if (user?.mustChangePassword) {
        navigation.replace('ChangePassword', { homeRoute });
        return;
      }

      navigation.reset({
        index: 0,
        routes: [{ name: homeRoute }],
      });

    } catch (error) {

      Alert.alert(
        'Hindi Makapasok',
        error.message ||
          'Hindi nakita ang Mag-aaral ID o mali ang password.'
      );

    } finally {

      setLoading(false);

    }
  }

  return (

    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : 'height'
      }
    >

      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 150,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* TOP */}

        <View style={styles.topBar}>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() =>
              navigation.goBack()
            }
          >
            <Text style={styles.homeText}>
              ← Bumalik
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            🎒 Mag-aaral
          </Text>

        </View>

        {/* CARD */}

        <View style={styles.card}>
          {/* MAG-AARAL ID */}
          <Text style={styles.label}>
            🪪 Mag-aaral ID
          </Text>

          <View style={styles.inputBox}>

            <Text style={styles.inputIcon}>
              👤
            </Text>

            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={
                handleStudentIdChange
              }
              autoCapitalize="characters"
              autoCorrect={false}
            />

          </View>

          {/* PASSWORD */}

          <Text style={styles.label}>
            🔐 Password
          </Text>

          <View style={styles.inputBox}>

            <Text style={styles.inputIcon}>
              🔒
            </Text>

            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(value) => setPassword(cleanStudentLoginPasswordInput(value))}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(!showPassword)
              }
            >
              <Text style={styles.eye}>
                {showPassword ? '🙈' : '👁️'}
              </Text>
            </TouchableOpacity>

          </View>

          {/* LOGIN */}

          <TouchableOpacity
           style={[styles.loginButton, (loading || !studentId.trim() || !password.trim()) && styles.disabledButton]}

            activeOpacity={0.8}
            onPress={handleLogin}

            disabled={loading || !studentId.trim() || !password.trim()}
          >

            <Text style={styles.loginText}>
              {loading
                ? '⏳ Naglo-log in...'
                : '✨ Login'}
            </Text>

          </TouchableOpacity>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },

  topBar: {
    marginTop: 70,

    paddingHorizontal: 20,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  homeButton: {
    borderWidth: 2,
    borderColor: '#22C55E',

    paddingHorizontal: 16,
    paddingVertical: 8,

    borderRadius: 30,
  },

  homeText: { 
    color: '#16A34A', 
    fontFamily: 'Fredoka_600SemiBold', 
  },

  title: {
    fontSize: 24,
    fontFamily: 'Fredoka_700Bold',
    color: '#16A34A',
  },

  card: {
    backgroundColor: '#FFFFFF',

    margin: 20,
    padding: 24,

    borderRadius: 32,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 4,
  },

  heading: {
    fontSize: 22,
    fontFamily: 'Fredoka_700Bold',
    color: '#0F172A',

    flexShrink: 1,
  },

  sub: {
    marginTop: 4,

    fontSize: 14,
    color: '#64748B',

    fontFamily: 'Nunito_700Bold',

    lineHeight: 22,

    flexShrink: 1,
  },

  divider: {
    height: 1,

    backgroundColor: '#E5E7EB',

    marginVertical: 28,
  },

  label: {
    fontSize: 18,
    fontFamily: 'Fredoka_600SemiBold',

    color: '#166534',

    marginBottom: 12,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#A7F3D0',

    borderRadius: 20,

    paddingHorizontal: 16,

    backgroundColor: '#FFFFFF',

    marginBottom: 24,
  },

  inputIcon: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,

    paddingVertical: 16,

    fontSize: 16,
    color: '#0F172A',
    fontFamily: 'Nunito_700Bold',
  },

  invalidInput: {
    borderColor: '#DC2626',
  },

  eye: {
    fontSize: 20,
  },

  loginButton: {
    backgroundColor: '#22C55E',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 6,
  },

  loginText: {
    color: '#FFFFFF',

    fontSize: 22,
    fontFamily: 'Fredoka_700Bold',
  },

    errorText: {
    color: '#DC2626',
    marginTop: -16,
    marginBottom: 16,
    fontFamily:
      'Nunito_700Bold',
  },

  disabledButton: {
    opacity: 0.5,
  },

  validCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,

    borderWidth: 2,
    borderColor: '#22C55E',

    backgroundColor: '#FFFFFF',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 8,
  },

  validIcon: {
    color: '#22C55E',
    fontSize: 18,
    fontWeight: 'bold',
  },

});