import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, TextInput, StyleSheet } from 'react-native';
import { api } from '../api/client';
import Card from '../components/Card';
import PrimaryButton from '../components/PrimaryButton';
import { colors } from '../styles/theme';

export default function LessonDetailScreen({ route }) {
  const { id } = route.params;
  const [lesson, setLesson] = useState(null);
  const [writing, setWriting] = useState('');
  const [transcript, setTranscript] = useState('');

  useEffect(() => { api(`/lessons/${id}`).then(data => setLesson(data.lesson)); }, [id]);

  const mcq = useMemo(() => lesson?.activities?.find(a => a.type === 'mcq')?.questions?.[0], [lesson]);
  const writingTask = useMemo(() => lesson?.activities?.find(a => a.type === 'writing')?.writingTask, [lesson]);
  const speechTask = useMemo(() => lesson?.activities?.find(a => a.type === 'speech')?.speechTask, [lesson]);

  async function answer(optionId) {
    const data = await api(`/lessons/${id}/mcq`, { method: 'POST', body: { questionId: mcq.id, selectedOptionId: optionId } });
    Alert.alert(data.correct ? 'Tama!' : 'Subukan muli', data.correct ? '+5 XP' : 'Kaya mo yan!');
  }

  async function complete() {
    const data = await api(`/lessons/${id}/complete`, { method: 'POST', body: { score: 100 } });
    Alert.alert('Lesson', data.xpAwarded ? `Complete! +${data.xpAwarded} XP` : 'Already completed.');
  }

  if (!lesson) return <Text>Loading...</Text>;

  return (
    <ScrollView style={styles.screen}>
      <Card>
        <Text style={styles.eyebrow}>{lesson.subject}</Text>
        <Text style={styles.title}>{lesson.title}</Text>
        <Text style={styles.passage}>{lesson.passage}</Text>
      </Card>

      {mcq && <Card>
        <Text style={styles.heading}>{mcq.question}</Text>
        {mcq.options.map(o => <PrimaryButton key={o.id} variant="secondary" onPress={() => answer(o.id)}>{o.optionText}</PrimaryButton>)}
      </Card>}

      {writingTask && <Card>
        <Text style={styles.heading}>Writing</Text>
        <Text>{writingTask.prompt}</Text>
        <TextInput style={styles.textarea} value={writing} onChangeText={setWriting} multiline placeholder="Isulat ang sagot..." />
        <PrimaryButton onPress={async () => {
          const data = await api(`/lessons/${id}/writing`, { method: 'POST', body: { taskId: writingTask.id, content: writing } });
          Alert.alert('Saved', data.submission.feedback);
        }}>Submit Writing</PrimaryButton>
      </Card>}

      {speechTask && <Card>
        <Text style={styles.heading}>Speech Practice</Text>
        <Text>{speechTask.targetText}</Text>
        <TextInput style={styles.textarea} value={transcript} onChangeText={setTranscript} multiline placeholder="Transcript..." />
        <PrimaryButton variant="secondary" onPress={async () => {
          await api(`/lessons/${id}/speech`, { method: 'POST', body: { taskId: speechTask.id, transcript } });
          Alert.alert('Saved', 'Speech attempt saved.');
        }}>Save Speech Attempt</PrimaryButton>
      </Card>}

      <PrimaryButton onPress={complete}>Mark Lesson Complete</PrimaryButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg, padding: 16 },
  eyebrow: { color: colors.primary, fontWeight: '900' },
  title: { fontSize: 26, fontWeight: '900', color: colors.ink },
  passage: { marginTop: 12, lineHeight: 22, color: colors.ink },
  heading: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  textarea: { minHeight: 100, backgroundColor: '#fff', borderWidth: 1, borderColor: '#edf0f7', borderRadius: 16, padding: 12, marginVertical: 10, textAlignVertical: 'top' }
});
