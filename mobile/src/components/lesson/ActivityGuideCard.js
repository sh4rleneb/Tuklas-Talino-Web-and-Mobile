import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

function getActivityGuide(activity = {}, littleLearnerGame = false) {
  const type = String(
    activity?.type ||
    activity?.activityType ||
    activity?.category ||
    activity?.kind ||
    ''
  ).toLowerCase();

  const hasQuestionsWithOptions =
    Array.isArray(activity?.questions) &&
    activity.questions.some(q =>
      Array.isArray(q?.options) || Array.isArray(q?.choices)
    );

  const hasChoices =
    Array.isArray(activity?.choices) ||
    Array.isArray(activity?.options) ||
    Array.isArray(activity?.answers) ||
    hasQuestionsWithOptions;

  const hasAudio =
    Boolean(activity?.audioUrl) ||
    Boolean(activity?.audio) ||
    Boolean(activity?.soundUrl);

  if (hasAudio || type.includes('listen') || type.includes('audio') || type.includes('hearing')) {
    return {
      icon: '👂',
      title: 'Makinig muna',
      body: 'Pindutin ang audio kung mayroon, pakinggan nang mabuti, pagkatapos sagutin ang gawain.',
      steps: ['Makinig', 'Sagutin', 'Continue'],
    };
  }

  if (type.includes('write') || type.includes('writing') || type.includes('essay') || type.includes('text')) {
    return {
      icon: '✍️',
      title: 'Isulat ang maikling sagot',
      body: 'Gamitin ang kahon sa ibaba. Lalabas ang green button kapag may naisulat ka na.',
      steps: ['Basahin', 'Magsulat', 'Save'],
    };
  }

  if (type.includes('speak') || type.includes('record') || type.includes('voice') || type.includes('oral')) {
    return {
      icon: '🎙️',
      title: 'I-record ang iyong sagot',
      body: 'Basahin ang speech target, pindutin ang record, magsalita nang malinaw, at i-save ang sagot.',
      steps: ['Target', 'Record', 'Save'],
    };
  }

  if (
    type === 'mcq' ||
    type.includes('mcq') ||
    hasChoices ||
    type.includes('quiz') ||
    type.includes('choice') ||
    type.includes('question') ||
    type.includes('multiple')
  ) {
    return {
      icon: '👆',
      title: littleLearnerGame ? 'Tap the Answer Game' : 'Pumili ng tamang sagot',
      body: littleLearnerGame
        ? 'Tap the correct answer tile to move closer to the finish flag.'
        : 'I-tap ang isang kahon. Kapag napili mo na ang sagot, maaari ka nang magpatuloy.',
      steps: littleLearnerGame ? ['Read', 'Tap', 'Win'] : ['Basahin', 'Piliin', 'Continue'],
    };
  }

  return {
    icon: '🧭',
    title: 'Sundin ang gawain',
    body: 'Basahin muna ang panuto, gawin ang activity, pagkatapos pindutin ang button para magpatuloy.',
    steps: ['Basahin', 'Gawin', 'Continue'],
  };
}

export default function ActivityGuideCard({ activity, littleLearnerGame }) {
  if (!activity) return null;

  const guide = getActivityGuide(activity, littleLearnerGame);

  return (
    <View style={styles.guideCard}>
      <View style={styles.guideIconBubble}>
        <Text style={styles.guideIcon}>{guide.icon}</Text>
      </View>

      <View style={styles.guideContent}>
        <Text style={styles.guideTitle}>{guide.title}</Text>
        <Text style={styles.guideBody}>{guide.body}</Text>

        <View style={styles.guideSteps}>
          {guide.steps.map((item, index) => (
            <View key={`${item}-${index}`} style={styles.guideStepPill}>
              <Text style={styles.guideStepNumber}>{index + 1}</Text>
              <Text style={styles.guideStepText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  guideCard:{flexDirection:'row',backgroundColor:'#F8FAFC',borderRadius:24,padding:16,marginBottom:18},
  guideIconBubble:{width:56,height:56,borderRadius:28,backgroundColor:'#DCFCE7',justifyContent:'center',alignItems:'center',marginRight:14},
  guideIcon:{fontSize:28},
  guideContent:{flex:1},
  guideTitle:{fontSize:18,fontWeight:'900',color:'#0F172A',marginBottom:6},
  guideBody:{fontSize:15,color:'#475569',lineHeight:22},
  guideSteps:{flexDirection:'row',flexWrap:'wrap',marginTop:14},
  guideStepPill:{flexDirection:'row',alignItems:'center',backgroundColor:'#ECFDF5',borderRadius:999,paddingHorizontal:10,paddingVertical:6,marginRight:8,marginBottom:8},
  guideStepNumber:{width:22,height:22,borderRadius:11,backgroundColor:'#22C55E',color:'#FFF',textAlign:'center',fontWeight:'900',overflow:'hidden'},
  guideStepText:{marginLeft:8,fontWeight:'700',color:'#166534'},
});
