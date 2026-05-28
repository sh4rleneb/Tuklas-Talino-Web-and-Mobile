import React from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';

const { width } = Dimensions.get('window');

export default function LandingScreen({ navigation }) {
  return (
    <View style={styles.container}>
      {/* FIXED HEADER */}

      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Image
            source={require('../../../assets/icons/tuklas-logo.png')}
            style={styles.logo}
          />

          <View>
            <Text style={styles.logoTitle}>
              Tuklas Talino
            </Text>

            <Text style={styles.logoSubtitle}>
              Matuto. Tuklasin. Magtagumpay.
            </Text>
          </View>
        </View>
      </View>

      {/* HORIZONTAL SLIDES */}

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="center"
      >
        {/* HERO SLIDE */}

        <View style={styles.slide}>
          <View style={styles.heroCard}>
            <Text style={styles.heroTitle}>
              Masayang Matuto sa Tuklas Talino!
            </Text>

            <Text style={styles.heroDescription}>
              Para sa Grades 1–6:
              lessons, quizzes,
              missions, badges,
              games, at teacher
              monitoring.
            </Text>

            <View style={styles.featureRow}>
              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>
                  🤖
                </Text>

                <Text style={styles.featureTitle}>
                  AI Powered
                </Text>
              </View>

              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>
                  🎮
                </Text>

                <Text style={styles.featureTitle}>
                  Games
                </Text>
              </View>

              <View style={styles.featureBox}>
                <Text style={styles.featureIcon}>
                  🏅
                </Text>

                <Text style={styles.featureTitle}>
                  XP
                </Text>
              </View>
            </View>

            <Image
              source={require('../../../assets/characters/boy.png')}
              style={styles.heroImage}
            />

            <Text style={styles.swipeText}>
              ← Swipe to continue →
            </Text>
          </View>
        </View>

        {/* STUDENT */}

        <View style={styles.slide}>
          <View style={styles.studentCard}>
            <Image
              source={require('../../../assets/characters/student.png')}
              style={styles.cardImage}
            />

            <Text style={styles.studentTitle}>
              Student
            </Text>

            <Text style={styles.cardDescription}>
              Access lessons,
              quizzes, badges,
              missions, games,
              and learning progress.
            </Text>

            <TouchableOpacity
              style={styles.studentButton}
              onPress={() =>
                navigation.navigate(
                  'StudentLogin'
                )
              }
            >
              <Text style={styles.buttonText}>
                Student Login →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* TEACHER */}

        <View style={styles.slide}>
          <View style={styles.teacherCard}>
            <Image
              source={require('../../../assets/characters/teacher.png')}
              style={styles.cardImage}
            />

            <Text style={styles.teacherTitle}>
              Teacher
            </Text>

            <Text style={styles.cardDescription}>
              Create lessons,
              monitor progress,
              manage groups,
              and review outputs.
            </Text>

            <TouchableOpacity
              style={styles.teacherButton}
              onPress={() =>
                navigation.navigate(
                  'TeacherLogin'
                )
              }
            >
              <Text style={styles.buttonText}>
                Teacher Login →
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ADMIN */}

        <View style={styles.slide}>
          <View style={styles.adminCard}>
            <Image
              source={require('../../../assets/characters/admin.png')}
              style={styles.cardImage}
            />

            <Text style={styles.adminTitle}>
              Admin
            </Text>

            <Text style={styles.cardDescription}>
              Manage accounts,
              system settings,
              reports, and
              platform controls.
            </Text>

            <TouchableOpacity
              style={styles.adminButton}
              onPress={() =>
                navigation.navigate(
                  'AdminLogin'
                )
              }
            >
              <Text style={styles.buttonText}>
                Admin Login →
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F5FA',
  },

  header: {
    backgroundColor: '#FFFFFF',
    paddingTop: 45,
    paddingBottom: 15,
    paddingHorizontal: 20,

    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  logo: {
    width: 65,
    height: 65,
    resizeMode: 'contain',
    marginRight: 10,
  },

  logoTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#16A34A',
  },

  logoSubtitle: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },

  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },

  heroCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 30,
    padding: 25,
    alignItems: 'center',
  },

  heroTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#15803D',
    textAlign: 'center',
    lineHeight: 50,
  },

  heroDescription: {
    fontSize: 18,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 30,
    marginTop: 20,
    fontWeight: '600',
  },

  featureRow: {
    flexDirection: 'row',
    marginTop: 30,
    justifyContent: 'space-between',
    width: '100%',
  },

  featureBox: {
    alignItems: 'center',
    flex: 1,
  },

  featureIcon: {
    fontSize: 35,
  },

  featureTitle: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },

  heroImage: {
    width: 260,
    height: 260,
    resizeMode: 'contain',
    marginTop: 20,
  },

  swipeText: {
    marginTop: 15,
    fontSize: 16,
    color: '#64748B',
    fontWeight: '600',
  },

  studentCard: {
    width: '100%',
    backgroundColor: '#F0FDF4',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },

  teacherCard: {
    width: '100%',
    backgroundColor: '#EFF6FF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },

  adminCard: {
    width: '100%',
    backgroundColor: '#FAF5FF',
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },

  cardImage: {
    width: 180,
    height: 180,
    resizeMode: 'contain',
    marginBottom: 20,
  },

  studentTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#16A34A',
  },

  teacherTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#2563EB',
  },

  adminTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#9333EA',
  },

  cardDescription: {
    fontSize: 18,
    lineHeight: 32,
    color: '#475569',
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '600',
  },

  studentButton: {
    backgroundColor: '#22C55E',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 30,
  },

  teacherButton: {
    backgroundColor: '#2563EB',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 30,
  },

  adminButton: {
    backgroundColor: '#9333EA',
    width: '100%',
    paddingVertical: 20,
    borderRadius: 100,
    alignItems: 'center',
    marginTop: 30,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});