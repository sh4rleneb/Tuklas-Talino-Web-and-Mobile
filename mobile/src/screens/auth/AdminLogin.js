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
function cleanLoginIdentifierInput(value, shouldUppercase = false) {
  const cleaned = String(value || '')
    .replace(/\s+/g, '')
    .replace(/[^A-Za-z0-9._@-]/g, '');

  return shouldUppercase ? cleaned.toUpperCase() : cleaned;
}

function cleanLoginPasswordInput(value) {
  return String(value || '').replace(/\s+/g, '');
}

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
function handleIdentifierChange(value) {
    setIdentifier(cleanLoginIdentifierInput(value, false));
  }

  const handleLogin = async () => {

    if (loading) return;

    if (!identifier || !password) {

      Alert.alert(
        'May Kulang',
        'Pakilagay ang wastong admin username at password.'
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
        'Hindi Makapasok',
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
              ← Bumalik
            </Text>

          </TouchableOpacity>

          <Text style={styles.title}>
            🛡️ Admin
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
            Maligayang Pagdating, Admin!
          </Text>

          <Text style={styles.sub}>
            Mag-login upang pamahalaan
            ang mga account,
            mga ulat, analytics,
            at mga setting ng sistema.
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
              onChangeText={handleIdentifierChange}
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
                color="#7C3AED"
              />

            </TouchableOpacity>

          </View>

          {/* LOGIN */}

          <TouchableOpacity
            style={[styles.loginButton, (loading || !identifier.trim() || !password.trim()) && styles.disabledButton]}
            onPress={handleLogin}
            disabled={loading || !identifier.trim() || !password.trim()}
          >

            <Text
              style={
                styles.loginButtonText
              }
            >
              {loading
                ? 'Naglo-load...'
                : '✨ Mag-login'}
            </Text>

          </TouchableOpacity>

          {/* FOOTER */}

          <Text style={styles.footer}>
            🔒 Para lamang sa mga
            awtorisadong administrator.
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

    fontFamily: 'Fredoka_600SemiBold',
  },

  title: {
    fontSize: 22,

    fontFamily: 'Fredoka_700Bold',

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

    fontFamily: 'Fredoka_700Bold',

    color: '#6D28D9',
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

    fontFamily: 'Nunito_700Bold',
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

    fontFamily: 'Nunito_700Bold',
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

    fontFamily: 'Fredoka_700Bold',
  },

  footer: {
    marginTop: 22,

    textAlign: 'center',

    color: '#64748B',

    fontSize: 14,

    lineHeight: 24,

    fontFamily: 'Nunito_700Bold',
  },


  invalidInput: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },

  validCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },

  validIcon: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },

  disabledButton: {
    opacity: 0.55,
  },

});
