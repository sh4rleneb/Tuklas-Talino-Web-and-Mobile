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

export default function StudentLogin({ navigation }) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('🦊');

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const avatars = [
    '🦊',
    '🐼',
    '🐯',
    '🐸',
    '🦁',
    '🦄',
    '🐰',
    '👦',
  ];

  async function handleLogin() {
    try {
      if (!studentId || !password) {
        Alert.alert(
          'Missing Fields',
          'Please enter Student ID and Password.'
        );
        return;
      }

      setLoading(true);

      const data = await api('/auth/login', {
        method: 'POST',
        body: {
          role: 'student',
          identifier: studentId,
          password,
        },
      });

      await setToken(data.token);

      const gradeLevel = Number(
        data?.user?.gradeLevel
      );

      console.log('FULL LOGIN RESPONSE:', data);

      /*
        Grade 1-2 = Junior
        Grade 3-6 = Senior
      */

      if (gradeLevel === 1 || gradeLevel === 2) {
        navigation.replace('StudentJuniorHome');
      } else {
        navigation.replace('StudentSeniorHome');
      }

    } catch (error) {
      Alert.alert(
        'Login Failed',
        error.message || 'Invalid credentials.'
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
          : undefined
      }
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={{
          paddingBottom: 120,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}

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
            🎒 Student Login
          </Text>
        </View>

        {/* CARD */}

        <View style={styles.card}>

          <Text style={styles.heading}>
            Pumili ng Avatar
          </Text>

          <Text style={styles.sub}>
            Piliin ang avatar na gusto mong gamitin.
          </Text>

          {/* AVATARS */}

          <View style={styles.avatarGrid}>

            {avatars.map((avatar, index) => {
              const selected =
                selectedAvatar === avatar;

              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.avatarButton,

                    selected &&
                      styles.selectedAvatar,
                  ]}
                  onPress={() =>
                    setSelectedAvatar(avatar)
                  }
                >
                  <Text style={styles.avatarText}>
                    {avatar}
                  </Text>

                  {selected && (
                    <View style={styles.checkBadge}>
                      <Text style={styles.checkText}>
                        ✓
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

          </View>

          {/* STUDENT ID */}

          <Text style={styles.label}>
            🪪 Student ID
          </Text>

          <TextInput
            style={styles.input}
            value={studentId}
            onChangeText={setStudentId}
            placeholder="STU-2025-001"
            placeholderTextColor="#94A3B8"
          />

          {/* PASSWORD */}

          <Text style={styles.label}>
            🔐 Password
          </Text>

          <View style={styles.passwordContainer}>

            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
              secureTextEntry={!showPassword}
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

          {/* LOGIN BUTTON */}

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginText}>
              {loading
                ? 'Loading...'
                : '✨ Login'}
            </Text>
          </TouchableOpacity>

          {/* SECURITY */}

          <TouchableOpacity
            style={styles.secureButton}
          >
            <Text style={styles.secureText}>
              🛡️ Secure & Protected Login
            </Text>
          </TouchableOpacity>

          <Text style={styles.footer}>
            🔒 Ang iyong impormasyon ay ligtas at protektado.
          </Text>

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
    marginTop: 50,
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
    color: '#15803D',
    fontWeight: '800',
  },

  title: {
    fontSize: 24,
    fontWeight: '900',
    color: '#16A34A',
  },

  card: {
    backgroundColor: '#FFFFFF',

    margin: 20,
    padding: 24,

    borderRadius: 30,
  },

  heading: {
    fontSize: 32,
    fontWeight: '900',
    color: '#0F172A',
  },

  sub: {
    marginTop: 10,
    fontSize: 18,
    color: '#475569',
    lineHeight: 28,
  },

  avatarGrid: {
    marginTop: 30,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  avatarButton: {
    width: '22%',

    aspectRatio: 1,

    backgroundColor: '#FEF9C3',

    borderRadius: 100,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 18,

    borderWidth: 4,
    borderColor: '#D1FAE5',
  },

  selectedAvatar: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5',
  },

  avatarText: {
    fontSize: 38,
  },

  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,

    width: 28,
    height: 28,

    borderRadius: 100,

    backgroundColor: '#22C55E',

    justifyContent: 'center',
    alignItems: 'center',
  },

  checkText: {
    color: '#FFFFFF',
    fontWeight: '900',
  },

  label: {
    marginTop: 20,
    marginBottom: 10,

    fontSize: 22,
    fontWeight: '900',

    color: '#166534',
  },

  input: {
    borderWidth: 3,
    borderColor: '#A7F3D0',

    borderRadius: 24,

    paddingHorizontal: 20,
    paddingVertical: 18,

    fontSize: 20,
    backgroundColor: '#FFFFFF',
  },

  passwordContainer: {
    borderWidth: 3,
    borderColor: '#A7F3D0',

    borderRadius: 24,

    paddingHorizontal: 20,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',

    backgroundColor: '#FFFFFF',
  },

  passwordInput: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 20,
  },

  eye: {
    fontSize: 22,
  },

  loginButton: {
    marginTop: 30,

    backgroundColor: '#16A34A',

    paddingVertical: 20,

    borderRadius: 100,

    alignItems: 'center',
  },

  loginText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },

  secureButton: {
    marginTop: 18,

    borderWidth: 2,
    borderColor: '#22C55E',

    borderRadius: 18,

    paddingVertical: 16,

    alignItems: 'center',
  },

  secureText: {
    color: '#15803D',
    fontSize: 18,
    fontWeight: '800',
  },

  footer: {
    marginTop: 20,

    textAlign: 'center',

    color: '#64748B',

    fontSize: 14,
    lineHeight: 24,
  },

});