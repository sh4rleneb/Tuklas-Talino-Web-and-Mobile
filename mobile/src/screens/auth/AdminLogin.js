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

import { Ionicons }
from '@expo/vector-icons';

import { loginAdmin }
from '../../api/auth';

export default function AdminLogin({
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

      const data = await loginAdmin(
        identifier,
        password
      );

      if (data.user?.mustChangePassword) {
        navigation.replace(
          'ChangePassword',
          { homeRoute: 'AdminHome' }
        );
        return;
      }

      navigation.replace(
        'AdminHome'
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
            🛡️ Admin Login
          </Text>

        </View>

        {/* CARD */}

        <View style={styles.card}>

          <View style={styles.headerIconBox}>

            <Text style={styles.headerEmoji}>
              🛡️
            </Text>

          </View>

          <Text style={styles.heading}>
            Welcome, Admin!
          </Text>

          <Text style={styles.sub}>
            Login to manage accounts,
            reports, analytics, and
            system settings.
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
              onChangeText={setIdentifier}
              placeholder="Enter your username"
              placeholderTextColor="#94A3B8"
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
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
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
                color="#7C3AED"
              />

            </TouchableOpacity>

          </View>

          {/* LOGIN */}

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

          {/* FOOTER */}

          <Text style={styles.footer}>
            🔒 Authorized administrators
            only.
          </Text>

        </View>

      </ScrollView>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#F5F3FF',
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
    borderColor: '#7C3AED',

    paddingHorizontal: 18,
    paddingVertical: 8,

    borderRadius: 30,
  },

  homeText: {
    color: '#7C3AED',

    fontFamily: 'Poppins_700Bold',
  },

  title: {
    fontSize: 22,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#7C3AED',
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

    backgroundColor: '#EDE9FE',

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

    fontFamily: 'Poppins_800ExtraBold',

    color: '#6D28D9',
  },

  sub: {
    fontSize: 15,

    color: '#64748B',

    marginTop: 10,
    marginBottom: 30,

    lineHeight: 26,

    textAlign: 'center',

    fontFamily: 'Poppins_500Medium',
  },

  label: {
    fontSize: 18,

    fontFamily: 'Poppins_700Bold',

    color: '#5B21B6',

    marginBottom: 12,
  },

  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',

    borderWidth: 2,
    borderColor: '#C4B5FD',

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

    fontFamily: 'Poppins_500Medium',
  },

  passwordContainer: {
    borderWidth: 2,
    borderColor: '#C4B5FD',

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

    fontFamily: 'Poppins_500Medium',
  },

  loginButton: {
    backgroundColor: '#7C3AED',

    paddingVertical: 20,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 6,
  },

  loginButtonText: {
    color: '#FFF',

    fontSize: 21,

    fontFamily: 'Poppins_800ExtraBold',
  },

  footer: {
    marginTop: 22,

    textAlign: 'center',

    color: '#64748B',

    fontSize: 14,

    lineHeight: 24,

    fontFamily: 'Poppins_500Medium',
  },

});
