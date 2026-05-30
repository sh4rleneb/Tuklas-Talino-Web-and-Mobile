import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';

export default function StudentJuniorHome({
  navigation,
}) {
  
  const [showMore, setShowMore] =
    useState(false);

  return (

    <View style={styles.wrapper}>

      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 130,
        }}
      >

        {/* HEADER */}

        <View style={styles.header}>

          <View style={styles.headerTop}>

            <Text style={styles.logo}>
              🏡 Tuklas Talino
            </Text>

            <TouchableOpacity
              style={styles.logoutButton}
              onPress={() =>
                navigation.replace(
                  'Landing'
                )
              }
            >
              <Text style={styles.logoutText}>
                Logout
              </Text>
            </TouchableOpacity>

          </View>

          <TouchableOpacity
            style={styles.profileChip}
          >
            <Text style={styles.profileEmoji}>
              🐰
            </Text>

            <Text style={styles.profileText}>
              Lia • Grade 1
            </Text>
          </TouchableOpacity>

        </View>

        {/* HERO */}

        <View style={styles.hero}>

          <Image
            source={require('../../../assets/characters/student.png')}
            style={styles.heroImage}
            resizeMode="contain"
          />

          <View style={styles.heroCard}>

          <Text style={styles.greeting}>
            Kamusta, Lia! 👋
          </Text>

            <Text style={styles.subtitle}>
              Ready ka na ba sa
              learning adventure?
            </Text>

            <View style={styles.xpContainer}>

              <View>

                <Text style={styles.xpLabel}>
                  Current XP
                </Text>

                <Text style={styles.xpText}>
                  ⭐ 15 XP
                </Text>

              </View>

              <View style={styles.levelBadge}>

                <Text style={styles.levelText}>
                  Level 1
                </Text>

              </View>

            </View>

            <View style={styles.progressBar}>

              <View
                style={styles.progressFill}
              />

            </View>

            <Text style={styles.progressText}>
              85 XP more until next
              level!
            </Text>

          </View>

        </View>

        {/* NAVIGATION */}

        <View style={styles.navCard}>

          {[
            '📘 Lessons',
            '🧠 Quizzes',
            '🎮 Missions',
            '👥 Groups',
          ].map((item) => (

            <TouchableOpacity
              key={item}
              style={styles.navGridButton}
              onPress={() => {

                if (
                  item === '📘 Lessons'
                ) {
                  navigation.navigate(
                    'ModulesScreen'
                  );
                }

              }}
            >

              <Text style={styles.navGridText}>
                {item}
              </Text>

            </TouchableOpacity>

          ))}

        </View>

        {/* LESSONS */}

        <Text style={styles.sectionTitle}>
          Mga Aralin
        </Text>

        <TouchableOpacity
          style={styles.lessonCard}
          onPress={() =>
            navigation.navigate(
              'ModulesScreen'
            )
          }
        >

          <View style={styles.lessonLeft}>

            <Text style={styles.lessonEmoji}>
              📖
            </Text>

            <View>

              <Text
                style={styles.lessonTitle}
              >
                Pagbasa
              </Text>

              <Text
                style={styles.lessonSub}
              >
                Learn reading basics
              </Text>

            </View>

          </View>

          <Text style={styles.lessonArrow}>
            →
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lessonCard}
          onPress={() =>
            navigation.navigate(
              'ModulesScreen'
            )
          }
        >

          <View style={styles.lessonLeft}>

            <Text style={styles.lessonEmoji}>
              🔤
            </Text>

            <View>

              <Text
                style={styles.lessonTitle}
              >
                Bokabularyo
              </Text>

              <Text
                style={styles.lessonSub}
              >
                Learn new words
              </Text>

            </View>

          </View>

          <Text style={styles.lessonArrow}>
            →
          </Text>

        </TouchableOpacity>

      </ScrollView>

      {/* BOTTOM NAV */}

      <View style={styles.bottomNav}>

        <TouchableOpacity
          style={[
            styles.navButton,
            styles.activeNavButton,
          ]}
        >

          <Text style={styles.navIcon}>
            🏠
          </Text>

          <Text
            style={styles.activeNavText}
          >
            Home
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() =>
            navigation.navigate(
              'ModulesScreen'
            )
          }
        >

          <Text style={styles.navIcon}>
            📚
          </Text>

          <Text style={styles.navText}>
            Lessons
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
          onPress={() =>
            navigation.navigate(
              'QuizScreen'
            )
          }
        >

          <Text style={styles.navIcon}>
            🧠
          </Text>

          <Text style={styles.navText}>
            Quizzes
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navButton}
        >

          <Text style={styles.navIcon}>
            🎮
          </Text>

          <Text style={styles.navText}>
            Missions
          </Text>

        </TouchableOpacity>

        <TouchableOpacity
        style={styles.navButton}
        onPress={() =>
          setShowMore(!showMore)
        }
      >
        <Text style={styles.navIcon}>
          ⋯
        </Text>

        <Text style={styles.navText}>
          More
        </Text>
      </TouchableOpacity>

      </View>

      {showMore && (

        <View style={styles.moreMenu}>

          <TouchableOpacity
            style={styles.moreItem}
            onPress={() =>
              navigation.navigate(
                'GroupsScreen'
              )
            }
          >
            <Text style={styles.moreText}>
              👥 Groups
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreItem}
            onPress={() =>
              navigation.navigate(
                'BadgesScreen'
              )
            }
          >
            <Text style={styles.moreText}>
              🏅 Badges
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreItem}
            onPress={() =>
              navigation.navigate(
                'ProfileScreen'
              )
            }
          >
            <Text style={styles.moreText}>
              👤 Profile
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.moreItem}
            onPress={() =>
              navigation.replace(
                'Landing'
              )
            }
          >
            <Text style={styles.moreText}>
              🚪 Logout
            </Text>
          </TouchableOpacity>

        </View>

      )}

    </View>

  );
}

const styles = StyleSheet.create({

  wrapper: {
    flex: 1,
    backgroundColor: '#F4FFF4',
  },

  container: {
    flex: 1,
    paddingHorizontal: 18,
  },

    header: {
    marginTop: 55,

    backgroundColor: '#FFFFFF',

    borderRadius: 28,

    padding: 18,

    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,

    elevation: 4,
  },

  headerTop: {
    flexDirection: 'row',

    justifyContent: 'space-between',

    alignItems: 'center',
  },

    profileChip: {
    marginTop: 18,

    alignSelf: 'flex-start',

    flexDirection: 'row',
    alignItems: 'center',

    backgroundColor: '#ECFDF5',

    paddingHorizontal: 16,
    paddingVertical: 10,

    borderRadius: 999,
  },

  profileEmoji: {
    fontSize: 18,
    marginRight: 6,
  },

  profileText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Poppins_600SemiBold',
  },

  logo: {
    fontSize: 26,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#16A34A',
  },

    logoutButton: {
    backgroundColor: '#FEE2E2',

    paddingHorizontal: 22,
    paddingVertical: 12,

    borderRadius: 20,
  },

  logoutText: {
    color: '#DC2626',

    fontSize: 14,

    fontFamily: 'Poppins_700Bold',
  },

  hero: {
    marginTop: 24,

    backgroundColor: '#22C55E',

    borderRadius: 36,

    padding: 20,
  },

  heroImage: {
    width: '100%',
    height: 220,
  },

  heroCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    padding: 24,

    marginTop: 18,
  },

    greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  greetingAvatar: {
    fontSize: 34,
    marginRight: 10,
  },

  wave: {
    fontSize: 32,
    marginTop: 6,
  },

  greeting: {
    fontSize: 34,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#0F172A',
  },

  subtitle: {
    marginTop: 10,

    fontSize: 16,

    color: '#475569',

    lineHeight: 28,

    fontFamily: 'Poppins_500Medium',
  },

  xpContainer: {
    marginTop: 22,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  xpLabel: {
    fontSize: 13,

    color: '#64748B',

    marginBottom: 4,

    fontFamily: 'Poppins_600SemiBold',
  },

  xpText: {
    fontSize: 28,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#0F172A',
  },

  levelBadge: {
    backgroundColor: '#FEF3C7',

    paddingHorizontal: 18,
    paddingVertical: 10,

    borderRadius: 999,
  },

  levelText: {
    color: '#92400E',

    fontSize: 14,

    fontFamily: 'Poppins_700Bold',
  },

  progressBar: {
    marginTop: 24,

    height: 12,

    backgroundColor: '#DCFCE7',

    borderRadius: 999,
  },

  progressFill: {
    width: '22%',

    height: '100%',

    backgroundColor: '#4ADE80',

    borderRadius: 999,
  },

  progressText: {
    marginTop: 10,

    color: '#64748B',

    fontSize: 13,

    fontFamily: 'Poppins_500Medium',
  },

  navCard: {
    marginTop: 24,

    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    padding: 18,

    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  navGridButton: {
    backgroundColor: '#FEF3C7',

    width: '48%',

    borderRadius: 22,

    paddingVertical: 18,

    alignItems: 'center',

    marginBottom: 12,
  },

  navGridText: {
    fontFamily: 'Poppins_700Bold',

    color: '#0F172A',
  },

  sectionTitle: {
    marginTop: 30,
    marginBottom: 18,

    fontSize: 28,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#0F172A',
  },

  lessonCard: {
    backgroundColor: '#FFFFFF',

    borderRadius: 30,

    padding: 22,

    marginBottom: 16,

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  lessonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  lessonEmoji: {
    fontSize: 48,
    marginRight: 18,
  },

  lessonTitle: {
    fontSize: 22,

    fontFamily: 'Poppins_800ExtraBold',

    color: '#0F172A',
  },

  lessonSub: {
    marginTop: 4,

    color: '#64748B',

    fontSize: 14,

    fontFamily: 'Poppins_500Medium',
  },

  lessonArrow: {
    fontSize: 28,

    color: '#16A34A',
  },

  bottomNav: {
    position: 'absolute',

    bottom: 0,
    left: 0,
    right: 0,

    backgroundColor: '#FFFFFF',

    flexDirection: 'row',

    justifyContent: 'space-evenly',

    alignItems: 'center',

    paddingVertical: 12,
    paddingHorizontal: 6,

    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',

    elevation: 10,
  },

  navButton: {
    alignItems: 'center',

    justifyContent: 'center',

    minWidth: 50,

    paddingVertical: 8,

    borderRadius: 18,
  },

  activeNavButton: {
    backgroundColor: '#FEF3C7',

    borderWidth: 2,
    borderColor: '#FCD34D',

    paddingHorizontal: 16,
  },

  navIcon: {
    fontSize: 22,
  },

  activeNavText: {
    marginTop: 2,

    color: '#16A34A',

    fontSize: 11,

    fontFamily: 'Poppins_700Bold',
  },

  navText: {
    marginTop: 2,

    color: '#334155',

    fontSize: 11,

    fontFamily: 'Poppins_600SemiBold',
  },

    moreMenu: {
    position: 'absolute',

    right: 20,
    bottom: 95,

    backgroundColor: '#FFFFFF',

    borderRadius: 20,

    width: 180,

    paddingVertical: 10,

    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 10,

    elevation: 8,
  },

  moreItem: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },

  moreText: {
    fontSize: 15,

    color: '#0F172A',

    fontFamily:
      'Poppins_600SemiBold',
  },

});