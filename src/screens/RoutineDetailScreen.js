import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const DAYS_OF_WEEK = [
  { id: 'monday', key: 'routines.days.monday' },
  { id: 'tuesday', key: 'routines.days.tuesday' },
  { id: 'wednesday', key: 'routines.days.wednesday' },
  { id: 'thursday', key: 'routines.days.thursday' },
  { id: 'friday', key: 'routines.days.friday' },
  { id: 'saturday', key: 'routines.days.saturday' },
  { id: 'sunday', key: 'routines.days.sunday' },
];

export default function RoutineDetailScreen({ route, navigation }) {
  const { t } = useLanguage();
  const { programId, programName } = route.params || { programId: 'default', programName: 'Program Detayı' };

  // State to hold saved titles per day
  const [dayTitles, setDayTitles] = useState({});

  // Fetch saved titles every time this screen gains focus
  useFocusEffect(
    useCallback(() => {
      const loadDayTitles = async () => {
        try {
          const titlesMap = {};
          for (const day of DAYS_OF_WEEK) {
            const dayNameTranslated = t(day.key);
            const key = `@program_${programId}_${dayNameTranslated}`;
            const savedData = await AsyncStorage.getItem(key);
            if (savedData) {
              const parsed = JSON.parse(savedData);
              if (parsed && parsed.dayTitle && parsed.dayTitle.trim() !== '') {
                titlesMap[day.id] = parsed.dayTitle;
              }
            }
          }
          setDayTitles(titlesMap);
        } catch (error) {
          console.warn('Gün başlıkları yüklenirken hata:', error);
        }
      };

      loadDayTitles();
    }, [programId, t])
  );

  const handleDayPress = (day) => {
    const dayNameTranslated = t(day.key);
    navigation.navigate('DayDetail', {
      programId,
      programName,
      dayId: day.id,
      dayName: dayNameTranslated,
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {programName}
        </Text>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('routines.days.weeklySchedule')}</Text>

        {DAYS_OF_WEEK.map((day) => {
          const dayNameText = t(day.key);
          const plannedTitle = dayTitles[day.id];
          const isPlanned = Boolean(plannedTitle);

          return (
            <TouchableOpacity
              key={day.id}
              style={styles.dayCard}
              activeOpacity={0.7}
              onPress={() => handleDayPress(day)}
            >
              <View style={styles.dayCardLeft}>
                <View
                  style={[
                    styles.dayIconContainer,
                    isPlanned && styles.dayIconContainerActive,
                  ]}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={22}
                    color={isPlanned ? Colors.primary : Colors.textMuted}
                  />
                </View>
                <View style={styles.dayInfo}>
                  <Text style={styles.dayName}>{dayNameText}</Text>
                  <Text
                    style={[
                      styles.daySubTitle,
                      isPlanned && styles.daySubTitleActive,
                    ]}
                  >
                    {isPlanned ? plannedTitle : t('routines.days.notPlanned')}
                  </Text>
                </View>
              </View>

              <View style={styles.chevronContainer}>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
            </TouchableOpacity>
          );
        })}
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
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  headerRightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    marginLeft: 4,
  },
  dayCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  dayIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayIconContainerActive: {
    backgroundColor: Colors.primaryGlow,
  },
  dayInfo: {
    flex: 1,
  },
  dayName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  daySubTitle: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  daySubTitleActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
