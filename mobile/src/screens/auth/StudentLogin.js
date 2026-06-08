import React, { useEffect, useState } from 'react';

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
  ActivityIndicator,
} from 'react-native';

import { api, setToken } from '../../api/client';

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

  const [studentValid, setStudentValid] =
    useState(false);

  const [studentChecking, setStudentChecking] =
    useState(false);

  const [studentValidationMessage, setStudentValidationMessage] =
    useState('');

  const [selectedAvatar, setSelectedAvatar] =
    useState('🦊');

    const avatars = [
    '🦊',
    '🐼',
    '🐯',
    '🐸',
    '🐵',
    '🦄',
    '🐰',
    '🧒',
    '👧',
  ];

  useEffect(() => {
    const identifier = studentId.trim();
    const hasValidFormat = /^STU-\d{4}-\d{3}$/.test(identifier);

    if (!identifier) {
      setStudentValid(false);
      setStudentChecking(false);
      setStudentValidationMessage('');
      return undefined;
    }

    if (!hasValidFormat) {
      setStudentValid(false);
      setStudentChecking(false);
      setStudentValidationMessage('Example: STU-2025-001');
      return undefined;
    }

    let active = true;
    setStudentValid(false);
    setStudentChecking(true);
    setStudentValidationMessage('Checking student ID...');

    const timer = setTimeout(async () => {
      try {
        const data = await api(`/auth/check-student/${encodeURIComponent(identifier)}`);

        if (!active) return;

        setStudentValid(Boolean(data.exists));
        setStudentValidationMessage(
          data.exists ? '' : 'Student ID was not found or is inactive.'
        );
      } catch (error) {
        if (!active) return;
        setStudentValid(false);
        setStudentValidationMessage(error.message || 'Unable to validate Student ID.');
      } finally {
        if (active) setStudentChecking(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [studentId]);

  function handleStudentIdChange(value) {

  const upper =
    value.toUpperCase();

    setStudentId(upper);
}

  async function handleLogin() {

    if (loading) return;

    try {

      if (!studentId || !password || !studentValid) {
        Alert.alert(
          'Missing Fields',
          'Please enter a valid Student ID and Password.'
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
            avatar: selectedAvatar,
          },
        }
      );

      const user = data.user;

      if (!user) {
        Alert.alert(
          'Login Failed',
          'User data not found.'
        );

        return;
      }

      await setToken(data.token);

      const gradeLevel = Number(
        user.student?.gradeLevel
      );

      /*
        Grade 1-2 = Junior
        Grade 1-6 = Shared student tabs
      */

      const homeRoute = gradeLevel <= 2
        ? 'StudentJuniorHome'
        : 'StudentTabs';

      if (user.mustChangePassword) {
        navigation.replace(
          'ChangePassword',
          { homeRoute }
        );
      } else if (gradeLevel <= 2) {

        navigation.replace('StudentTabs');

      } else {

        navigation.replace(
          'StudentTabs'
        );

      }

    } catch (error) {

      Alert.alert(
        'Login Failed',
        error.message ||
          'Invalid credentials.'
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
              ← Home
            </Text>
          </TouchableOpacity>

          <Text style={styles.title}>
            🎒 Student Login
          </Text>

        </View>

        {/* CARD */}

        <View style={styles.card}>

          {/* AVATAR HEADER */}

          <View style={styles.avatarHeader}>

            <View
              style={
                styles.avatarHeaderIcon
              }
            >
              <Text
                style={
                  styles.avatarHeaderEmoji
                }
              >
                👤
              </Text>
            </View>

            <View style={styles.avatarHeaderText}>
            <Text
              style={styles.heading}
            >
                Pumili ng Avatar
              </Text>

              <Text style={styles.sub}>
                Piliin ang avatar na
                gusto mong gamitin.
              </Text>

            </View>

          </View>

          {/* AVATARS */}

          <View style={styles.avatarGrid}>

            {avatars.map(
              (avatar, index) => {

                const selected =
                  selectedAvatar ===
                  avatar;

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarButton,

                      selected &&
                        styles.selectedAvatar,
                    ]}
                    onPress={() =>
                      setSelectedAvatar(
                        avatar
                      )
                    }
                  >

                    <Text
                      style={
                        styles.avatarText
                      }
                    >
                      {avatar}
                    </Text>

                  </TouchableOpacity>
                );
              }
            )}

          </View>

          {/* DIVIDER */}

          <View style={styles.divider} />

          {/* STUDENT ID */}
          <Text style={styles.label}>
            🪪 Student ID
          </Text>

          <View
            style={[
              styles.inputBox,

              studentId.length > 0 &&
              !studentChecking &&
              !studentValid &&

              styles.invalidInput,
            ]}
          >

            <Text style={styles.inputIcon}>
              👤
            </Text>

            <TextInput
              style={styles.input}
              value={studentId}
              onChangeText={
                handleStudentIdChange
              }
              placeholder="Ex: STU-2025-001"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
              autoCorrect={false}
            />

            {studentValid && (
              <View style={styles.validCircle}>
                <Text style={styles.validIcon}>
                  ✔
                </Text>
              </View>
            )}

            {studentChecking && (
              <ActivityIndicator
                size="small"
                color="#16A34A"
              />
            )}

          </View>

            {studentValidationMessage ? (
                <Text style={styles.errorText}>
                  {studentValidationMessage}
                </Text>
              ) : null}

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
              onChangeText={setPassword}
              placeholder="Default: student123"
              placeholderTextColor="#64748B"
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
           style={[
              styles.loginButton,

              (
                !studentValid ||
                studentChecking ||
                !password.trim()
              ) &&
              styles.disabledButton,
            ]}

            activeOpacity={0.8}
            onPress={handleLogin}

            disabled={
              loading ||
              !studentValid ||
              studentChecking ||
              !password.trim()
            }
          >

            <Text style={styles.loginText}>
              {loading
                ? '⏳ Logging In...'
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
    fontFamily: 'Poppins_700Bold', 
  },

  title: {
    fontSize: 24,
    fontFamily: 'Poppins_800ExtraBold',
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

  avatarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },

  avatarHeaderText: {
  flex: 1,
  paddingRight: 10,
  },

  avatarHeaderIcon: {
    width: 55,
    height: 55,

    borderRadius: 100,

    backgroundColor: '#DCFCE7',

    justifyContent: 'center',
    alignItems: 'center',

    marginRight: 14,
  },

  avatarHeaderEmoji: {
    fontSize: 24,
  },

  heading: {
    fontSize: 22,
    fontFamily: 'Poppins_800ExtraBold',
    color: '#0F172A',

    flexShrink: 1,
  },

  sub: {
    marginTop: 4,

    fontSize: 14,
    color: '#64748B',

    fontFamily: 'Poppins_500Medium',

    lineHeight: 22,

    flexShrink: 1,
  },

  avatarGrid: {
    marginTop: 26,

    flexDirection: 'row',
    flexWrap: 'wrap',

    justifyContent: 'space-between',
  },

  avatarButton: {
    width: '22%',

    aspectRatio: 1,

    borderRadius: 100,

    justifyContent: 'center',
    alignItems: 'center',

    marginBottom: 18,

    backgroundColor: '#FEF9C3',

    borderWidth: 4,
    borderColor: '#D1FAE5',
  },

  selectedAvatar: {
    borderColor: '#22C55E',
    backgroundColor: '#ECFDF5',
    shadowColor: '#22C55E',
    shadowOpacity: 0.3,
    shadowRadius: 8,

    elevation: 6,

    transform: [
      {
        scale: 1.05,
      },
    ],
  },

  avatarText: {
    fontSize: 34,
  },

  divider: {
    height: 1,

    backgroundColor: '#E5E7EB',

    marginVertical: 28,
  },

  label: {
    fontSize: 18,
    fontFamily: 'Poppins_700Bold',

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
    fontFamily: 'Poppins_500Medium',
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
    fontFamily: 'Poppins_800ExtraBold',
  },

    errorText: {
    color: '#DC2626',
    marginTop: -16,
    marginBottom: 16,
    fontFamily:
      'Poppins_500Medium',
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
