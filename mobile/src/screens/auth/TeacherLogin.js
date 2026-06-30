import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Ionicons }
from '@expo/vector-icons';

import { loginTeacher }
from '../../api/auth';

function cleanLoginIdentifierInput(value, shouldUppercase = false) {
  const cleaned = String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9._@-]/g, '');

  return shouldUppercase ? cleaned.toUpperCase() : cleaned;
}

function cleanLoginPasswordInput(value) {
  return String(value || '').replace(/\s+/g, '');
}

export default function TeacherLogin({
  navigation,
}) {

  const [identifier, setIdentifier] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [showPassword, setShowPassword] =
    useState(false);

  const handleLogin = async () => {

    if (!identifier || !password) {

      Alert.alert(
        'Missing Fields',
        'Please complete all fields.'
      );

      return;
    }

    try {

      setLoading(true);

      const data = await loginTeacher(
        identifier,
        password
      );

      if (data.user?.mustChangePassword) {
        navigation.replace(
          'ChangePassword',
          { homeRoute: 'TeacherHome' }
        );
        return;
      }

      navigation.replace(
        'TeacherHome'
      );

    } catch (error) {

      Alert.alert(
        'Login Failed',
        error.message
      );

    } finally {

      setLoading(false);

    }
  };

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
          paddingBottom: 100,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        {/* TOP BAR */}

        <View style={styles.topBar}>

          <TouchableOpacity
            style={styles.homeButton}
            onPress={() =>
              navigation.goBack()
            }
          >

            <Text style={styles.homeText}>
              ← Home
            </Text>

          </TouchableOpacity>

          <Text style={styles.title}>
            👩‍🏫 Teacher Login
          </Text>

        </View>

        {/* CARD */}

        <View style={styles.card}>

          <View style={styles.headerIconBox}>

            <Text style={styles.headerEmoji}>
              👩‍🏫
            </Text>

          </View>

          <Text style={styles.heading}>
            Welcome, Teacher!
          </Text>

          <Text style={styles.sub}>
            Login to manage lessons,
            monitor students, and
            review progress.
          </Text>

          {/* USERNAME */}

          <Text style={styles.label}>
            👤 Username
          </Text>

          <View style={styles.inputBox}>

            <Text style={styles.icon}>
              👤
            </Text>

            <TextInput
              style={styles.input}
              value={identifier}
              onChangeText={(value) => setIdentifier(cleanLoginIdentifierInput(value, true))}
              placeholder="Enter your username"
              placeholderTextColor="#94A3B8"
              spellCheck={false}
              autoCorrect={false}
              autoCapitalize="none"
            />

          </View>

          {/* PASSWORD */}

          <Text style={styles.label}>
            🔐 Password
          </Text>

          <View
            style={styles.passwordContainer}
          >

            <Text style={styles.icon}>
              🔒
            </Text>

            <TextInput
              style={styles.passwordInput}
              secureTextEntry={
                !showPassword
              }
              value={password}
              onChangeText={(value) => setPassword(cleanLoginPasswordInput(value))}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              spellCheck={false}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <TouchableOpacity
              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >

              <Ionicons
                name={
                  showPassword
                    ? 'eye'
                    : 'eye-off'
                }
                size={22}
                color="#16A34A"
              />

            </TouchableOpacity>

          </View>

          {/* LOGIN BUTTON */}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >

            <Text
              style={
                styles.loginButtonText
              }
            >
              {loading
                ? 'Loading...'
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
    backgroundColor: '#ECFDF5',
  },

  topBar: {
    marginTop: 50,

    paddingHorizontal: 20,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  homeButton: {
    borderWidth: 2,
    borderColor: '#22C55E',

    paddingHorizontal: 18,
    paddingVertical: 8,

    borderRadius: 30,
  },

  homeText: {
    color: '#16A34A',

    fontFamily: 'Fredoka_600SemiBold',
  },

  title: {
    fontSize: 22,

    fontFamily: 'Fredoka_700Bold',

    color: '#16A34A',
  },

  card: {
    backgroundColor: '#FFFFFF',

    margin: 20,

    borderRadius: 34,

    padding: 26,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,

    elevation: 4,
  },

  headerIconBox: {
    width: 75,
    height: 75,

    borderRadius: 100,

    backgroundColor: '#DCFCE7',

    justifyContent: 'center',
    alignItems: 'center',

    alignSelf: 'center',

    marginBottom: 20,
  },

  headerEmoji: {
    fontSize: 34,
  },

  heading: {
    fontSize: 34,

    textAlign: 'center',

    fontFamily: 'Fredoka_700Bold',

    color: '#16A34A',
  },

  sub: {
    fontSize: 15,

    color: '#64748B',

    marginTop: 10,
    marginBottom: 30,

    lineHeight: 26,

    textAlign: 'center',

    fontFamily: 'Nunito_700Bold',
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

    borderRadius: 24,

    paddingHorizontal: 18,

    backgroundColor: '#FFFFFF',

    marginBottom: 24,
  },

  icon: {
    fontSize: 18,
    marginRight: 10,
  },

  input: {
    flex: 1,

    paddingVertical: 17,

    fontSize: 16,

    color: '#0F172A',

    fontFamily: 'Nunito_700Bold',
  },

  passwordContainer: {
    borderWidth: 2,
    borderColor: '#A7F3D0',

    borderRadius: 24,

    paddingHorizontal: 18,

    marginBottom: 26,

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#FFFFFF',
  },

  passwordInput: {
    flex: 1,

    paddingVertical: 17,

    fontSize: 16,

    color: '#0F172A',
  },

  loginButton: {
    backgroundColor: '#22C55E',

    paddingVertical: 20,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 6,
  },

  loginButtonText: {
    color: '#FFF',

    fontSize: 21,

    fontFamily: 'Fredoka_700Bold',
  },

});
