import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

import { Ionicons } from '@expo/vector-icons';

import { loginTeacher } from '../../api/auth';

export default function TeacherLogin({ navigation }) {
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

      await loginTeacher(
        identifier,
        password
      );

      Alert.alert(
        'Success',
        'Teacher login successful!'
      );

      navigation.replace('TeacherHome');

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
          👩‍🏫 Teacher Login
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.heading}>
          Mag-login, Guro!
        </Text>

        <Text style={styles.sub}>
          Gamitin ang iyong teacher username at password.
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
              color="#16A34A"
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
      </View>
    </ScrollView>
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
    fontWeight: '700',
  },

  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#16A34A',
  },

  card: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    borderRadius: 30,
    padding: 25,
  },

  heading: {
    fontSize: 40,
    fontWeight: '900',
    color: '#16A34A',
    marginBottom: 10,
  },

  sub: {
    fontSize: 17,
    color: '#6B7280',
    marginBottom: 30,
    lineHeight: 25,
  },

  label: {
    fontSize: 20,
    fontWeight: '800',
    color: '#166534',
    marginBottom: 10,
  },

  input: {
    borderWidth: 3,
    borderColor: '#A7F3D0',
    borderRadius: 22,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 18,
    marginBottom: 24,
    backgroundColor: '#FFF',
  },

  passwordContainer: {
    borderWidth: 3,
    borderColor: '#A7F3D0',
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
    backgroundColor: '#22C55E',
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
    borderColor: '#22C55E',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },

  secureButtonText: {
    color: '#16A34A',
    fontSize: 18,
    fontWeight: '800',
  },
});