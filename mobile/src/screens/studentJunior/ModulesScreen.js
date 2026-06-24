import React, { useEffect, useMemo, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../api/client';


function lessonTheme(subject) {
  const value = String(subject || '').toLowerCase();

  if (value.includes('bokabularyo')) {
    return {
      card: '#EEF6FF',
      icon: '🔠',
    };
  }

  if (value.includes('oral')) {
    return {
      card: '#FFF8E7',
      icon: '🎙️',
    };
  }

  if (value.includes('panitikan')) {
    return {
      card: '#FFF2E8',
      icon: '🪶',
    };
  }

  if (value.includes('pagsulat')) {
    return {
      card: '#F3F0FF',
      icon: '✍️',
    };
  }

  if (value.includes('pagbasa')) {
    return {
      card: '#F0FFF4',
      icon: '📖',
    };
  }

  return {
    card: '#F6FFF5',
    icon: '📚',
  };
}


export default function ModulesScreen({ navigation }) {
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState('All');

  async function loadModules() {
    try {
      setLoading(true);
      const data = await api('/lessons');
      setModules(data.lessons || []);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadModules();
  }, []);

  const subjects = useMemo(() => {
    const unique = new Set();
    modules.forEach((lesson) => {
      unique.add((lesson.subject || 'General').trim() || 'General');
    });
    return ['All', ...Array.from(unique)];
  }, [modules]);

  const filteredModules = useMemo(() => {
    if (selectedSubject === 'All') return modules;
    return modules.filter(
      (lesson) => (lesson.subject || 'General').trim() === selectedSubject
    );
  }, [modules, selectedSubject]);

  const sections = useMemo(() => {
    const grouped = filteredModules.reduce((acc, lesson) => {
      const subject = (lesson.subject || 'General').trim() || 'General';
      if (!acc[subject]) acc[subject] = [];
      acc[subject].push(lesson);
      return acc;
    }, {});

    return Object.entries(grouped).map(([subject, lessons]) => ({
      subject,
      lessons,
    }));
  }, [filteredModules]);

  function renderChip({ item }) {
    const active = item === selectedSubject;
    return (
      <TouchableOpacity
        style={[styles.chip, active && styles.activeChip]}
        onPress={() => setSelectedSubject(item)}
      >
        <Text style={[styles.chipText, active && styles.activeChipText]}>{item}</Text>
      </TouchableOpacity>
    );
  }

  function renderLessonCard(lesson) {
    const theme = lessonTheme(lesson.subject);

    return (
      <TouchableOpacity
        key={String(lesson.id)}
        style={[
          styles.lessonCard,
          { backgroundColor: theme.card }
        ]}
        activeOpacity={0.9}
        onPress={() =>
          navigation.navigate('Lessons', {
            screen: 'StudentJuniorLessonDetail',
            params: {
              lessonId: lesson.id,
            },
          })
        }
      >
        <View style={styles.lessonTopRow}>
          <View style={styles.lessonIconContainer}>
            <Text style={styles.lessonIcon}>
              {theme.icon}
            </Text>
          </View>

          <View style={styles.arrowButton}>
            <Text style={styles.arrowText}>›</Text>
          </View>
        </View>

        <Text style={styles.lessonTitle}>
          {lesson.title}
        </Text>

        <View style={styles.xpBadge}>
          <Text style={styles.xpText}>
            ⭐ {lesson.xpReward || 0} XP
          </Text>
        </View>

        <View style={styles.summaryBadge}>
          <Text style={styles.summaryText}>
            ✅ Summary
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  function renderSection({ item }) {
    return (
      <View style={styles.section}>
        <Text style={styles.subjectTitle}>{item.subject}</Text>
        <View style={styles.lessonList}>{item.lessons.map(renderLessonCard)}</View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.title}>📚 Modules</Text>

        <View style={styles.spacer} />
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#22C55E" />
          <Text style={styles.loadingText}>Loading lessons...</Text>
        </View>
      ) : (
        <FlatList
          data={sections}
          keyExtractor={(item) => item.subject}
          renderItem={renderSection}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.container}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.subtitle}>{filteredModules.length} lessons available</Text>
              <FlatList
                data={subjects}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(item) => item}
                renderItem={renderChip}
                contentContainerStyle={styles.chipRow}
              />
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📖</Text>
              <Text style={styles.emptyTitle}>No lessons found</Text>
              <Text style={styles.emptySubtitle}>Try another subject or refresh the screen.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F6FFF5',
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 34,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spacer: {
    width: 56,
  },
  backButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  backText: {
    color: '#16A34A',
    fontFamily: 'Fredoka_600SemiBold',
    fontSize: 14,
  },
  title: {
    fontSize: 30,
    color: '#16A34A',
    fontFamily: 'Fredoka_700Bold',
  },
  listHeader: {
    marginBottom: 18,
  },
  subtitle: {
    color: '#475569',
    fontFamily: 'Nunito_800ExtraBold',
    marginBottom: 12,
  },
  chipRow: {
    paddingBottom: 8,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeChip: {
    backgroundColor: '#DCFCE7',
    borderColor: '#22C55E',
  },
  chipText: {
    color: '#334155',
    fontFamily: 'Nunito_800ExtraBold',
  },
  activeChipText: {
    color: '#166534',
  },
  section: {
    marginBottom: 16,
  },
  subjectTitle: {
    fontSize: 22,
    color: '#0F172A',
    fontFamily: 'Fredoka_700Bold',
    marginBottom: 14,
  },
  lessonList: {
  },
  lessonCard: {
    borderRadius: 30,
    padding: 22,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },

  lessonTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },

  arrowButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  arrowText: {
    fontSize: 28,
    color: '#16A34A',
    fontWeight: '900',
  },
  lessonIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  lessonIcon: {
    fontSize: 28,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 18,
    color: '#0F172A',
    fontFamily: 'Fredoka_600SemiBold',
    marginBottom: 6,
  },
  lessonSubtitle: {
    color: '#475569',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 10,
  },
  lessonMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  lessonMeta: {
    color: '#64748B',
    fontFamily: 'Nunito_700Bold',
    marginRight: 12,
    marginBottom: 6,
  },
  xpBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpText: {
    color: '#92400E',
    fontFamily: 'Fredoka_600SemiBold',
  },

  summaryBadge: {
    alignSelf: 'flex-start',
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },

  summaryText: {
    color: '#16A34A',
    fontFamily: 'Nunito_800ExtraBold',
    fontSize: 12,
  },

  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontFamily: 'Nunito_800ExtraBold',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    marginTop: 40,
    borderRadius: 30,
    padding: 30,
    alignItems: 'center',
  },
  emptyEmoji: {
    fontSize: 52,
  },
  emptyTitle: {
    marginTop: 14,
    fontSize: 22,
    color: '#0F172A',
    fontFamily: 'Fredoka_600SemiBold',
  },
  emptySubtitle: {
    marginTop: 8,
    color: '#64748B',
    textAlign: 'center',
    fontFamily: 'Nunito_700Bold',
  },
});