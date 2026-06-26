import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  Animated,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function FillInBlankGame({
  rubric = {},
  submitting = false,
  onSubmit,
}) {
  const choices = rubric.choices || rubric.wordBank || [];
  const template = rubric.template || '';
  const correctAnswer = String(rubric.correctAnswer || '');

  const [selected, setSelected] = useState('');
  const [correct, setCorrect] = useState(false);

  const choiceScale = useRef(new Animated.Value(1)).current;
  const previewScale = useRef(new Animated.Value(1)).current;

  const preview = useMemo(() => {
    return template.replace(/_{2,}|\[blank\]/gi, selected || '______');
  }, [template, selected]);

  function checkAnswer(answer = selected) {
    const ok =
      String(answer).trim().toLowerCase() ===
      correctAnswer.trim().toLowerCase();

    setCorrect(ok);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.title}>🧩 Punan ang Patlang</Text>

      <Animated.View
        style={[
          styles.preview,
          selected && styles.previewSelected,
          {
            transform: [
              {
                scale: previewScale,
              },
            ],
          },
        ]}
      >
        <Text style={styles.previewText}>
          {preview}
        </Text>
      </Animated.View>

      <Text style={styles.subtitle}>
        Piliin ang tamang sagot.
      </Text>

      {choices.map((choice) => (
        <Animated.View
          key={choice}
          style={{
            transform: [
              {
                scale:
                  selected === choice
                    ? choiceScale
                    : 1,
              },
            ],
          }}
        >
        <TouchableOpacity
          disabled={submitting}
          onPress={() => {
            setSelected(choice);

            Animated.parallel([
              Animated.sequence([
                Animated.timing(choiceScale, {
                  toValue: 1.08,
                  duration: 120,
                  useNativeDriver: true,
                }),
                Animated.spring(choiceScale, {
                  toValue: 1,
                  useNativeDriver: true,
                }),
              ]),
              Animated.sequence([
                Animated.timing(previewScale, {
                  toValue: 1.05,
                  duration: 120,
                  useNativeDriver: true,
                }),
                Animated.spring(previewScale, {
                  toValue: 1,
                  useNativeDriver: true,
                }),
              ]),
            ]).start();

            setTimeout(() => {
              checkAnswer(choice);
            }, 180);
          }}
          style={[
            styles.choice,
            selected === choice && styles.choiceSelected,
          ]}
        >
          <Text
            style={[
              styles.choiceText,
              selected === choice &&
                styles.choiceTextSelected,
            ]}
          >
            {choice}
          </Text>
        </TouchableOpacity>
        </Animated.View>
      ))}

      {!selected ? (
        <View style={{ height: 60 }} />
      ) : correct ? (
        <>
          <View style={styles.successCard}>
            <Text style={styles.successTitle}>
              🎉 Great Job!
            </Text>

            <Text style={styles.successSentence}>
              {preview}
            </Text>
          </View>

          <TouchableOpacity
            disabled={submitting}
            style={styles.primary}
            onPress={() => onSubmit?.(selected)}
          >
            <Text style={styles.primaryText}>
              ✅ Continue
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <View style={styles.errorCard}>
            <Text style={styles.error}>
              ❌ Oops! Try again.
            </Text>
          </View>

          <TouchableOpacity
            style={styles.primary}
            onPress={() => {
              setSelected('');
            }}
          >
            <Text style={styles.primaryText}>
              Choose Again
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card:{
    marginBottom:24,
  },
  title:{
    fontSize:28,
    fontWeight:'900',
    textAlign:'center',
    marginBottom:18,
    color:'#1E3A8A',
  },
  subtitle:{
    marginBottom:18,
    textAlign:'center',
    color:'#64748B',
    fontSize:16,
  },
  preview:{
    backgroundColor:'#FFF7D6',
    borderRadius:24,
    padding:22,
    marginBottom:22,
  },

  previewSelected:{
    borderColor:'#FACC15',
    borderWidth:3,
    backgroundColor:'#FEF9C3',
  },

  previewText:{
    fontSize:24,
    fontWeight:'900',
    textAlign:'center',
    color:'#0F172A',
  },
  choice:{
    borderWidth:2,
    borderColor:'#BFDBFE',
    backgroundColor:'#FFFFFF',
    borderRadius:20,
    paddingVertical:18,
    paddingHorizontal:18,
    marginBottom:14,
  },
  choiceSelected:{
    backgroundColor:'#DBEAFE',
    borderColor:'#2563EB',
    borderWidth:3,
  },
  choiceText:{
    textAlign:'center',
    fontSize:20,
    fontWeight:'900',
    color:'#1E293B',
  },
  choiceTextSelected:{
    color:'#166534',
  },
  primary:{
    marginTop:18,
    borderRadius:22,
    paddingVertical:18,
    backgroundColor:'#22C55E',
  },
  primaryText:{
    color:'#fff',
    textAlign:'center',
    fontWeight:'900',
    fontSize:18,
  },

  successCard:{
    backgroundColor:'#DCFCE7',
    borderColor:'#22C55E',
    borderWidth:2,
    borderRadius:20,
    padding:18,
    marginTop:18,
    marginBottom:12,
  },

  successTitle:{
    textAlign:'center',
    fontSize:24,
    fontWeight:'900',
    color:'#166534',
    marginBottom:10,
  },

  successSentence:{
    textAlign:'center',
    fontSize:20,
    fontWeight:'800',
    color:'#14532D',
  },

  errorCard:{
    backgroundColor:'#FEE2E2',
    borderColor:'#EF4444',
    borderWidth:2,
    borderRadius:20,
    padding:18,
    marginTop:18,
    marginBottom:12,
  },


  success:{
    textAlign:'center',
    color:'#15803D',
    fontWeight:'900',
    fontSize:18,
  },
  error:{
    textAlign:'center',
    color:'#DC2626',
    fontWeight:'900',
    fontSize:18,
  },
});
