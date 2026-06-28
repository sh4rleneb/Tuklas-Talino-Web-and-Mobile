import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function LessonVocabularyActivity({
  activity,
  littleLearnerGame,
  onComplete,
}) {
  const words = activity?.dataJson?.words || [];

  const item = useMemo(() => words[0] || null, [words]);

  const [done, setDone] = useState(false);

  if (!item) {
    return null;
  }

  if (!littleLearnerGame) {
    return (
      <>
        {words.map((word, index) => (
          <View
            key={index}
            style={styles.contentRow}
          >
            <Text style={styles.word}>{word.word}</Text>
            <Text style={styles.meaning}>{word.meaning}</Text>
          </View>
        ))}
      </>
    );
  }

  function finish() {
    setDone(true);

    setTimeout(() => {
      onComplete?.();
    }, 800);
  }

  return (
    <View>
      <Text style={styles.title}>
        🎈 Pindutin ang tamang sagot!
      </Text>

      <View style={styles.card}>
        <Text style={styles.word}>
          {item.word}
        </Text>

        <TouchableOpacity
          style={styles.choice}
          onPress={finish}
          disabled={done}
        >
          <Text style={styles.choiceText}>
            🎈 {item.meaning}
          </Text>
        </TouchableOpacity>

        {done && (
          <View style={styles.success}>
            <Text style={styles.successTitle}>
              🌟 Ang Husay Mo! 🌟
            </Text>

            <Text style={styles.star}>
              ⭐ +1 Bituin!
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  title:{
    fontSize:22,
    fontWeight:'900',
    textAlign:'center',
    color:'#15803D',
    marginBottom:12,
  },

  card:{
    backgroundColor:'#F0FDF4',
    borderRadius:20,
    padding:16,
    marginBottom:20,
  },

  word:{
    fontSize:28,
    fontWeight:'900',
    textAlign:'center',
    marginBottom:18,
  },

  choice:{
    backgroundColor:'#FECACA',
    padding:14,
    borderRadius:999,
  },

  choiceText:{
    textAlign:'center',
    fontSize:22,
    fontWeight:'900',
  },

  success:{
    marginTop:16,
    backgroundColor:'#DCFCE7',
    borderRadius:20,
    padding:18,
    alignItems:'center',
  },

  successTitle:{
    fontSize:24,
    fontWeight:'900',
  },

  star:{
    marginTop:8,
    fontWeight:'900',
    color:'#CA8A04',
  },

  contentRow:{
    backgroundColor:'#F8FAFC',
    borderRadius:16,
    padding:14,
    marginBottom:10,
  },

  meaning:{
    marginTop:6,
    color:'#475569',
  },
});
