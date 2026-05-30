import React, { useState } from 'react';

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

const totalSlides = 4;

export default function LandingScreen({
  navigation,
}) {

  const [activeSlide, setActiveSlide] =
    useState(0);

  function handleScroll(event) {

    const slide = Math.round(
      event.nativeEvent.contentOffset.x /
        width
    );

    setActiveSlide(slide);
  }

  return (

    <View style={styles.container}>

      {/* HEADER */}

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
              Matuto. Tuklasin.
              Magtagumpay.
            </Text>

          </View>

        </View>

      </View>

      {/* CAROUSEL */}

      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToAlignment="center"
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        {/* HERO */}

        <View style={styles.slide}>

          <View style={styles.heroCard}>

            <Text style={styles.heroTitle}>
              Masayang Matuto sa
              Tuklas Talino!
            </Text>

            <Text
              style={
                styles.heroDescription
              }
            >
              Para sa Grades 1–6:
              lessons, quizzes,
              missions, badges,
              games, at teacher
              monitoring.
            </Text>

            {/* FEATURES */}

            <View style={styles.featureRow}>

              <View style={styles.featureBox}>

                <Text
                  style={
                    styles.featureIcon
                  }
                >
                  🤖
                </Text>

                <Text
                  style={
                    styles.featureTitle
                  }
                >
                  AI Powered
                </Text>

              </View>

              <View style={styles.featureBox}>

                <Text
                  style={
                    styles.featureIcon
                  }
                >
                  🎮
                </Text>

                <Text
                  style={
                    styles.featureTitle
                  }
                >
                  Games
                </Text>

              </View>

              <View style={styles.featureBox}>

                <Text
                  style={
                    styles.featureIcon
                  }
                >
                  🏅
                </Text>

                <Text
                  style={
                    styles.featureTitle
                  }
                >
                  XP
                </Text>

              </View>

            </View>

            {/* IMAGE */}

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

            <Text
              style={
                styles.cardDescription
              }
            >
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

            <Text
              style={
                styles.cardDescription
              }
            >
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

            <Text
              style={
                styles.cardDescription
              }
            >
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

      {/* PAGINATION */}

      <View style={styles.pagination}>

        {[...Array(totalSlides)].map(
          (_, index) => (

            <View
              key={index}
              style={[
                styles.dot,

                activeSlide === index &&
                  styles.activeDot,
              ]}
            />

          )
        )}

      </View>

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

    fontFamily: 'Poppins_800ExtraBold',

    color: '#16A34A',
  },

  logoSubtitle: {
    fontSize: 13,

    color: '#6B7280',

    marginTop: 2,

    fontFamily: 'Poppins_500Medium',
  },

  slide: {
    width,

    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 90,
  },

  heroCard: {
    width: '100%',

    backgroundColor: '#F0FDF4',

    borderRadius: 30,

    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 30,

    alignItems: 'center',
  },

  heroTitle: {
    fontSize: 32,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#15803D',

    textAlign: 'center',

    lineHeight: 42,
  },

  heroDescription: {
    fontSize: 16,

    color: '#475569',

    textAlign: 'center',

    lineHeight: 28,

    marginTop: 18,

    fontFamily: 'Poppins_500Medium',
  },

  featureRow: {
    flexDirection: 'row',

    marginTop: 22,

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

    fontFamily: 'Poppins_700Bold',

    color: '#0F172A',
  },

  heroImage: {
    width: 180,
    height: 180,

    resizeMode: 'contain',

    marginTop: 10,
    marginBottom: 15,
  },

  swipeText: {
    marginTop: 10,
    marginBottom: 28,

    fontSize: 16,

    color: '#64748B',

    textAlign: 'center',

    fontFamily: 'Poppins_500Medium',
  },

  studentCard: {
    width: '100%',

    backgroundColor: '#F0FDF4',

    borderRadius: 30,

    padding: 30,

    alignItems: 'center',

    minHeight: 610,
  },

  teacherCard: {
    width: '100%',

    backgroundColor: '#EFF6FF',

    borderRadius: 30,

    padding: 30,

    alignItems: 'center',

    minHeight: 610,
  },

  adminCard: {
    width: '100%',

    backgroundColor: '#FAF5FF',

    borderRadius: 30,

    padding: 30,

    alignItems: 'center',

    minHeight: 610,
  },

  cardImage: {
    width: 170,
    height: 170,

    resizeMode: 'contain',

    marginBottom: 18,
  },

  studentTitle: {
    fontSize: 38,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#16A34A',
  },

  teacherTitle: {
    fontSize: 38,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#2563EB',
  },

  adminTitle: {
    fontSize: 38,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#9333EA',
  },

  cardDescription: {
    fontSize: 17,

    lineHeight: 30,

    color: '#475569',

    textAlign: 'center',

    marginTop: 14,

    fontFamily: 'Poppins_500Medium',
  },

  studentButton: {
    backgroundColor: '#22C55E',

    width: '100%',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 28,
  },

  teacherButton: {
    backgroundColor: '#2563EB',

    width: '100%',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 28,
  },

  adminButton: {
    backgroundColor: '#9333EA',

    width: '100%',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 28,
  },

  buttonText: {
    color: '#FFFFFF',

    fontSize: 20,

    fontFamily: 'Poppins_700Bold',
  },

  pagination: {
    position: 'absolute',

    bottom: 18,

    width: '100%',

    flexDirection: 'row',

    justifyContent: 'center',
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,

    borderRadius: 100,

    backgroundColor: '#CBD5E1',

    marginHorizontal: 6,
  },

  activeDot: {
    width: 28,

    backgroundColor: '#16A34A',
  },

});