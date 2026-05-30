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
  ];

  function handleStudentIdChange(
  value
) {

  const upper =
    value.toUpperCase();

  setStudentId(upper);

  const regex =
    /^STU-\d{4}-\d{3}$/;

  setStudentValid(
    regex.test(upper)
  );

}

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

      const data = await api(
        '/auth/login',
        {
          method: 'POST',

          body: {
            role: 'student',
            identifier: studentId,
            password,
          },
        }
      );

      console.log(
        'FULL LOGIN RESPONSE:',
        data
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

      console.log(
        'GRADE LEVEL:',
        gradeLevel
      );

      /*
        Grade 1-2 = Junior
        Grade 3-6 = Senior
      */

      if (gradeLevel <= 2) {

        navigation.replace(
          'StudentJuniorHome'
        );

      } else {

        navigation.replace(
          'StudentSeniorHome'
        );

      }

    } catch (error) {

      console.log(error);

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
          paddingBottom: 100,
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
              placeholder="Halimbawa: STU-2025-001"
              placeholderTextColor="#64748B"
              autoCapitalize="characters"
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
              onChangeText={setPassword}
              placeholder="Default: student123"
              placeholderTextColor="#64748B"
              secureTextEntry={
                !showPassword
              }
            />


            <TouchableOpacity
              onPress={() =>
                setShowPassword(
                  !showPassword
                )
              }
            >
              <Text style={styles.eye}>
                {showPassword
                  ? '🙈'
                  : '👁️'}
              </Text>
            </TouchableOpacity>

          </View>

          {/* LOGIN */}

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

  eye: {
    fontSize: 20,
    color: '#16A34A',
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

  validBox: {

  backgroundColor:
    '#ECFDF5',

  alignSelf: 'stretch',

  justifyContent:
    'center',

  paddingHorizontal: 14,

  marginRight: -16,
},

validIcon: {
  color: '#22C55E',
  fontSize: 24,
  fontWeight: 'bold',
},

});