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
        disableIntervalMomentum
        decelerationRate="fast"
        snapToAlignment="center"
        scrollEventThrottle={16}
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
              Para sa mga Mag-aaral
              sa Baitang 1–6:
              mga aralin,
              pagsusulit,
              misyon, mga badge,
              mga laro, at
              gabay ng guro.
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
                  AI Tutor
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
                  Mga Laro
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
              ⬅ Mag-swipe upang makita ang iba pang card ➡
            </Text>

          </View>

        </View>

        {/* MAG-AARAL */}

        <View style={styles.slide}>

          <View style={styles.studentCard}>

            <Image
              source={require('../../../assets/characters/student.png')}
              style={styles.cardImage}
            />

            <Text style={styles.studentTitle}>
              Mag-aaral
            </Text>

            <Text
              style={
                styles.cardDescription
              }
            >
              Makilahok sa mga aralin,
              pagsusulit, badge,
              misyon, mga laro,
              at subaybayan ang iyong pag-unlad.
            </Text>

            <TouchableOpacity
              style={styles.studentButton}
              activeOpacity={0.9}
              onPress={() => navigation.navigate('StudentLogin')}
            >
              <Text style={styles.buttonText}>
                Mag-aaral →
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
              Guro
            </Text>

            <Text
              style={
                styles.cardDescription
              }
            >
              Gumawa ng mga aralin,
              subaybayan ang pag-unlad,
              pamahalaan ang mga grupo,
              at suriin ang mga gawain.
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
                Guro →
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
              Pamahalaan ang mga account,
              mga setting ng sistema,
              mga ulat,
              at mga kontrol ng platform.
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
                Admin →
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

    fontFamily: 'Fredoka_700Bold',

    color: '#6F35D7',
  },

  logoSubtitle: {
    fontSize: 13,

    color: '#6F35D7',

    marginTop: 2,

    fontFamily: 'Nunito_700Bold',
  },

  slide: {
    width,

    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 100,
  },

  heroCard: {
    width: '100%',

    backgroundColor: '#F0FDF4',

    borderRadius: 32,

    paddingHorizontal: 28,
    paddingTop: 30,
    paddingBottom: 36,

    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },

  heroTitle: {
    fontSize: 34,

    fontFamily: 'Fredoka_700Bold',

    color: '#6F35D7',

    textAlign: 'center',

    lineHeight: 46,
  },

  heroDescription: {
    fontSize: 16,

    color: '#6F35D7',

    textAlign: 'center',

    lineHeight: 32,

    marginTop: 20,

    fontFamily: 'Nunito_700Bold',
  },

  featureRow: {
    flexDirection: 'row',

    marginTop: 28,

    justifyContent: 'space-between',

    width: '100%',
  },

  featureBox: {
    alignItems: 'center',
    flex: 1,
  },

  featureIcon: {
    fontSize: 42,
  },

  featureTitle: {
    marginTop: 10,

    fontSize: 16,

    fontFamily: 'Fredoka_600SemiBold',

    color: '#6F35D7',
  },

  heroImage: {
    width: 180,
    height: 180,

    resizeMode: 'contain',

    marginTop: 10,
    marginBottom: 20,
  },

  swipeText: {
    marginTop: 10,
    marginBottom: 12,

    fontSize: 16,

    color: '#6F35D7',

    textAlign: 'center',

    fontFamily: 'Nunito_700Bold',
  },

  studentCard: {
    width: '100%',

    backgroundColor: '#F0FDF4',

    borderRadius: 30,

    padding: 34,

    alignItems: 'center',

    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,

    minHeight: 560,
  },

  teacherCard: {
    backgroundColor: '#EFF6FF',
    borderColor: '#2F80ED',
    shadowColor: '#2F80ED',
    width: '100%',


    borderRadius: 30,

    padding: 30,

    alignItems: 'center',

    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,

    minHeight: 610,
  },

  adminCard: {
    backgroundColor: '#F5F3FF',
    borderColor: '#6F35D7',
    shadowColor: '#6F35D7',
    width: '100%',


    borderRadius: 30,

    padding: 30,

    alignItems: 'center',

    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,

    minHeight: 610,
  },

  cardImage: {
    width: 190,
    height: 190,

    resizeMode: 'contain',

    marginBottom: 12,
  },

  studentTitle: {
    fontSize: 38,

    fontFamily: 'Fredoka_700Bold',

    color: '#6F35D7',
  },

  teacherTitle: {
    color: '#2F80ED',
    fontSize: 38,

    fontFamily: 'Fredoka_700Bold',

  },

  adminTitle: {
    color: '#6F35D7',
    fontSize: 38,

    fontFamily: 'Fredoka_700Bold',

  },

  cardDescription: {
    fontSize: 18,

    lineHeight: 32,

    color: '#6F35D7',

    textAlign: 'center',

    marginTop: 10,

    width: '92%',
    alignSelf: 'center',

    fontFamily: 'Nunito_700Bold',
  },

  studentButton: {
    backgroundColor: '#6F35D7',
    width: '82%',
    alignSelf: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 44,
    marginBottom: 6,
    shadowColor: '#6F35D7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 5,
  },

  teacherButton: {
    backgroundColor: '#2F80ED',
    borderColor: '#2F80ED',
    shadowColor: '#2F80ED',

    width: '92%',
    alignSelf: 'center',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 28,
  },

  adminButton: {
    backgroundColor: '#6F35D7',
    borderColor: '#6F35D7',
    shadowColor: '#6F35D7',

    width: '92%',
    alignSelf: 'center',

    paddingVertical: 18,

    borderRadius: 100,

    alignItems: 'center',

    marginTop: 28,
  },

  buttonText: {
    color: '#FFFFFF',
    fontSize: 21,
    fontFamily: 'Fredoka_600SemiBold',
    textAlign: 'center',
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
    width: 12,
    height: 12,

    borderRadius: 100,

    backgroundColor: '#6F35D7',

    marginHorizontal: 7,
  },

  activeDot: {
    width: 24,

    backgroundColor: '#6F35D7',
  },

});
