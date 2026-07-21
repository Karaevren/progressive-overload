import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';

export default function WorkoutScreen() {
  const { t } = useLanguage();
  const { formatWeight } = useSettings();

  const [exercises, setExercises] = useState([
    {
      id: '1',
      name: 'Dumbbell Curl',
      sets: 4,
      reps: 5,
      weight: 20,
      completedSets: [false, false, false, false],
      color: Colors.primary,
    },
    {
      id: '2',
      name: 'Pull-Up',
      sets: 3,
      reps: 8,
      weight: null,
      completedSets: [false, false, false],
      color: Colors.secondary,
    }
  ]);

  const toggleSet = (exerciseIndex, setIndex) => {
    setExercises((prevExercises) => {
      const newExercises = [...prevExercises];
      const ex = { ...newExercises[exerciseIndex] };
      const newCompletedSets = [...ex.completedSets];
      
      newCompletedSets[setIndex] = !newCompletedSets[setIndex];
      ex.completedSets = newCompletedSets;
      newExercises[exerciseIndex] = ex;
      
      return newExercises;
    });
  };

  const handleFinish = () => {
    Alert.alert(
      t('workout.completed'),
      t('workout.finishWorkout'),
      [{ text: 'OK' }]
    );
  };

  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screenTitles.workout')}</Text>
        <Text style={styles.headerSubtitle}>{todayDate}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{t('workout.todaysProgram')}</Text>
        
        {exercises.map((ex, exIdx) => {
          const completedCount = ex.completedSets.filter(Boolean).length;
          const weightDisplay = ex.weight ? formatWeight(ex.weight) : t('workout.bodyweight');

          return (
            <View key={ex.id} style={styles.cardContainer}>
              <View style={[styles.cardAccent, { backgroundColor: ex.color }]} />
              <View style={styles.cardContent}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>{weightDisplay}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>
                    {ex.reps} {t('workout.reps')}
                  </Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Text style={styles.metaText}>
                    {t('workout.setProgress', { completed: completedCount, total: ex.sets })}
                  </Text>
                </View>

                <View style={styles.setsRow}>
                  {ex.completedSets.map((isCompleted, setIdx) => (
                    <TouchableOpacity
                      key={setIdx}
                      style={[
                        styles.setCircle,
                        isCompleted && styles.setCircleCompleted
                      ]}
                      onPress={() => toggleSet(exIdx, setIdx)}
                      activeOpacity={0.7}
                    >
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={18} color={Colors.background} />
                      ) : (
                        <Text style={styles.setCircleText}>{setIdx + 1}</Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>
          );
        })}

        <TouchableOpacity 
          style={styles.finishButton} 
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <Text style={styles.finishButtonText}>{t('workout.finishWorkout')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: Colors.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  cardContainer: {
    backgroundColor: Colors.surface,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 16,
    flexDirection: 'row',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardAccent: {
    width: 4,
  },
  cardContent: {
    flex: 1,
    padding: 16,
  },
  exerciseName: {
    color: Colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 10,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  metaDot: {
    color: Colors.textMuted,
    fontSize: 14,
    marginHorizontal: 8,
  },
  setsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  setCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  setCircleCompleted: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  setCircleText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finishButtonText: {
    color: Colors.background,
    fontSize: 18,
    fontWeight: 'bold',
  },
});
