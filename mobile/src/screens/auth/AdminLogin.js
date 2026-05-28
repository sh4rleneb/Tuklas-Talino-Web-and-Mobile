import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { loginAdmin } from '../../api/auth';

export default function AdminLogin({ navigation }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

      await loginAdmin(
        identifier,
        password
      );

      Alert.alert(
        'Success',
        'Admin login successful!'
      );

      navigation.replace('AdminHome');

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
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.homeText}>
            ← Home
          </Text>
        </TouchableOpacity>

        <Text style={styles.title}>
          🛡️ Admin Login
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>
          Welcome Back, Admin
        </Text>

        <Text style={styles.sub}>
          Gamitin ang admin username at password.
        </Text>

        <Text style={styles.label}>
          👤 Username
        </Text>

        <TextInput
          style={styles.input}
          value={identifier}
          onChangeText={setIdentifier}
          placeholder="Enter your username"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>
          🔐 Password
        </Text>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#9CA3AF"
          />

          <TouchableOpacity
            onPress={() =>
              setShowPassword(!showPassword)
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

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.loginButtonText}>
            {loading
              ? 'Loading...'
              : '🔐 Login'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secureButton}>
          <Text style={styles.secureButtonText}>
            🛡️ Secure & Protected Login
          </Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          🔒 Only authorized administrators can access this system.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3E8FF',
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
    fontWeight: '700',
  },

  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#7C3AED',
  },

  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 30,
    padding: 25,
  },

  heading: {
    fontSize: 38,
    fontWeight: '900',
    color: '#6D28D9',
    marginBottom: 10,
  },

  sub: {
    fontSize: 17,
    color: '#6B7280',
    marginBottom: 30,
    lineHeight: 25,
  },

  label: {
    fontSize: 21,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 10,
  },

  input: {
    borderWidth: 3,
    borderColor: '#C4B5FD',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    marginBottom: 24,
    backgroundColor: '#FFF',
  },

  passwordContainer: {
    borderWidth: 3,
    borderColor: '#C4B5FD',
    borderRadius: 22,
    paddingHorizontal: 20,
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 18,
  },

  loginButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 22,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 10,
  },

  loginButtonText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900',
  },

  secureButton: {
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#9333EA',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },

  secureButtonText: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '800',
  },

  footer: {
    marginTop: 22,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 14,
    lineHeight: 22,
  },
});