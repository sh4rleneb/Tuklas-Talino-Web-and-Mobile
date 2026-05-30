import React, { useEffect, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView }
from 'react-native-safe-area-context';

import { api }
from '../../api/client';

export default function ModulesScreen({
  navigation,
}) {

  const [modules, setModules] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  async function loadModules() {

    try {

      setLoading(true);

      const data =
        await api('/lessons');

      setModules(
        data.lessons || []
      );

    } catch (error) {

      Alert.alert(
        'Error',
        error.message
      );

    } finally {

      setLoading(false);

    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  const groupedModules =
    modules.reduce(
      (acc, lesson) => {

        const subject =
          lesson.subject ||
          'General';

        if (!acc[subject]) {
          acc[subject] = [];
        }

        acc[subject].push(
          lesson
        );

        return acc;

      },
      {}
    );

  return (

    <SafeAreaView
      style={styles.safe}
    >

      <View
        style={styles.header}
      >

        <TouchableOpacity
          style={
            styles.backButton
          }
          onPress={() =>
            navigation.goBack()
          }
        >

          <Text
            style={
              styles.backText
            }
          >
            ← Back
          </Text>

        </TouchableOpacity>

        <Text
          style={styles.title}
        >
          📚 Modules
        </Text>

      </View>

      {loading ? (

        <View
          style={
            styles.loaderContainer
          }
        >

          <ActivityIndicator
            size="large"
            color="#22C55E"
          />

          <Text
            style={
              styles.loadingText
            }
          >
            Loading lessons...
          </Text>

        </View>

      ) : (

        <ScrollView
          style={styles.container}
          showsVerticalScrollIndicator={
            false
          }
        >

          {Object.keys(
            groupedModules
          ).length === 0 && (

            <View
              style={
                styles.emptyCard
              }
            >

              <Text
                style={
                  styles.emptyEmoji
                }
              >
                📖
              </Text>

              <Text
                style={
                  styles.emptyTitle
                }
              >
                No lessons found
              </Text>

            </View>

          )}

          {Object.entries(
            groupedModules
          ).map(
            (
              [subject, lessons]
            ) => (

              <View
                key={subject}
              >

                <Text
                  style={
                    styles.subjectTitle
                  }
                >
                  {subject}
                </Text>

                {lessons.map(
                  (
                    lesson
                  ) => (

                    <TouchableOpacity
                      key={
                        lesson.id
                      }
                      style={
                        styles.moduleCard
                      }
                      onPress={() =>
                        navigation.navigate(
                          'LessonScreen',
                          {
                            lessonId:
                              lesson.id,
                          }
                        )
                      }
                    >

                      <View
                        style={
                          styles.iconCircle
                        }
                      >

                        <Text
                          style={
                            styles.icon
                          }
                        >
                          📘
                        </Text>

                      </View>

                      <View
                        style={{
                          flex: 1,
                        }}
                      >

                        <Text
                          style={
                            styles.moduleTitle
                          }
                        >
                          {
                            lesson.title
                          }
                        </Text>

                        <Text
                          style={
                            styles.moduleInfo
                          }
                        >
                          Grade{' '}
                          {
                            lesson.gradeLevel
                          }
                        </Text>

                        <Text
                          style={
                            styles.moduleInfo
                          }
                        >
                          ⏱{' '}
                          {
                            lesson.duration
                          } mins
                        </Text>

                      </View>

                      <View
                        style={
                          styles.xpBadge
                        }
                      >

                        <Text
                          style={
                            styles.xpText
                          }
                        >
                          +
                          {
                            lesson.xpReward
                          } XP
                        </Text>

                      </View>

                    </TouchableOpacity>

                  )
                )}

              </View>

            )
          )}

          <View
            style={{
              height: 40,
            }}
          />

        </ScrollView>

      )}

    </SafeAreaView>

  );
}

const styles =
  StyleSheet.create({

    safe: {
      flex: 1,
      backgroundColor:
        '#F6FFF5',
    },

    container: {
      flex: 1,
      paddingHorizontal: 18,
    },

    header: {
      paddingHorizontal: 18,
      paddingTop: 10,
      paddingBottom: 20,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'space-between',
    },

    backButton: {
      backgroundColor:
        '#FFFFFF',

      paddingHorizontal: 18,
      paddingVertical: 10,

      borderRadius: 18,
    },

    backText: {
      color: '#16A34A',
      fontFamily:
        'Poppins_700Bold',
    },

    title: {
      fontSize: 28,

      color: '#16A34A',

      fontFamily:
        'Poppins_800ExtraBold',
    },

    loaderContainer: {
      flex: 1,

      justifyContent:
        'center',

      alignItems:
        'center',
    },

    loadingText: {
      marginTop: 12,

      color: '#64748B',

      fontFamily:
        'Poppins_600SemiBold',
    },

    subjectTitle: {
      marginTop: 15,
      marginBottom: 12,

      fontSize: 24,

      color: '#0F172A',

      fontFamily:
        'Poppins_800ExtraBold',
    },

    moduleCard: {
      backgroundColor:
        '#FFFFFF',

      borderRadius: 26,

      padding: 18,

      marginBottom: 14,

      flexDirection:
        'row',

      alignItems:
        'center',

      shadowColor:
        '#000',

      shadowOpacity:
        0.05,

      shadowRadius: 8,

      elevation: 3,
    },

    iconCircle: {
      width: 60,
      height: 60,

      borderRadius: 100,

      backgroundColor:
        '#DCFCE7',

      justifyContent:
        'center',

      alignItems:
        'center',

      marginRight: 14,
    },

    icon: {
      fontSize: 28,
    },

    moduleTitle: {
      fontSize: 18,

      color: '#0F172A',

      fontFamily:
        'Poppins_700Bold',
    },

    moduleInfo: {
      marginTop: 3,

      color: '#64748B',

      fontFamily:
        'Poppins_500Medium',
    },

    xpBadge: {
      backgroundColor:
        '#FEF3C7',

      paddingHorizontal:
        14,

      paddingVertical: 8,

      borderRadius: 999,
    },

    xpText: {
      color: '#92400E',

      fontFamily:
        'Poppins_700Bold',
    },

    emptyCard: {
      backgroundColor:
        '#FFFFFF',

      marginTop: 50,

      borderRadius: 30,

      padding: 30,

      alignItems:
        'center',
    },

    emptyEmoji: {
      fontSize: 50,
    },

    emptyTitle: {
      marginTop: 12,

      fontSize: 20,

      color: '#0F172A',

      fontFamily:
        'Poppins_700Bold',
    },

  });