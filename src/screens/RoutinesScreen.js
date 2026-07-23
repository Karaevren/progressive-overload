import React, { useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const ROUTINES_STORAGE_KEY = '@routines_list';
const ACTIVE_PROGRAM_KEY = '@activeProgramId';

const PROGRAM_ICONS = [
  { name: 'flame-outline', color: '#FF6B6B' },
  { name: 'repeat-outline', color: '#6C63FF' },
  { name: 'heart-outline', color: '#00E5A0' },
  { name: 'fitness-outline', color: '#FFB84D' },
  { name: 'barbell-outline', color: '#00B8D4' },
];

const defaultPrograms = [
  {
    id: 'stok_1',
    title: 'İleri Seviye: 5 Günlük Hipertrofi',
    description: 'Kas geliştirme odaklı yoğun program ve dinlenme günleri.',
    days: [
      {
        dayName: '1. Gün - İtiş',
        exercises: [
          { name: 'Plate Loaded Chest Press', type: 'weight', sets: 2, reps: 6 },
          { name: 'Smith Machine Low Incline Press', type: 'weight', sets: 2, reps: 6 },
          { name: 'Chest Fly Machine', type: 'weight', sets: 1, reps: 8 },
          { name: 'Shoulder Press Machine', type: 'weight', sets: 2, reps: 8 },
          { name: 'Lateral Raise', type: 'weight', sets: 3, reps: 10 },
          { name: 'Triceps Pushdown', type: 'weight', sets: 2, reps: 8 },
          { name: 'Overhead Rope Extension', type: 'weight', sets: 2, reps: 10 }
        ]
      },
      {
        dayName: '2. Gün - Çekiş',
        exercises: [
          { name: 'Lat Pulldown', type: 'weight', sets: 2, reps: 8 },
          { name: 'Plate Loaded Wide Grip Row', type: 'weight', sets: 3, reps: 8 },
          { name: 'Cable Row', type: 'weight', sets: 1, reps: 10 },
          { name: 'Incline Dumbell Curl', type: 'weight', sets: 2, reps: 8 },
          { name: 'Cable Curl', type: 'weight', sets: 2, reps: 8 },
          { name: 'Hammer & Reverse Curl (Superset)', type: 'weight', sets: 2, reps: 10 }
        ]
      },
      {
        dayName: '3. Gün - Bacak & Karın/Kalf',
        exercises: [
          { name: 'Leg Press', type: 'weight', sets: 2, reps: 8 },
          { name: 'Smith Machine Squat', type: 'weight', sets: 2, reps: 8 },
          { name: 'Leg Extension', type: 'weight', sets: 2, reps: 10 },
          { name: 'Seated Leg Curl', type: 'weight', sets: 3, reps: 10 },
          { name: 'Standing Calf Raise', type: 'weight', sets: 3, reps: 10 },
          { name: 'Cable Crunch', type: 'weight', sets: 3, reps: 10 }
        ]
      },
      {
        dayName: '4. Gün - Dinlenme',
        exercises: []
      },
      {
        dayName: '5. Gün - İtiş Varyasyon',
        exercises: [
          { name: 'Shoulder Press Machine', type: 'weight', sets: 2, reps: 8 },
          { name: 'Lateral Raise', type: 'weight', sets: 3, reps: 10 },
          { name: 'Smith Machine Low Incline Press', type: 'weight', sets: 2, reps: 6 },
          { name: 'Chest Fly Machine', type: 'weight', sets: 2, reps: 8 },
          { name: 'Cable Rear Delt Fly', type: 'weight', sets: 2, reps: 10 },
          { name: 'Triceps Pushdown', type: 'weight', sets: 2, reps: 8 },
          { name: 'Overhead Rope Extension', type: 'weight', sets: 2, reps: 10 }
        ]
      },
      {
        dayName: '6. Gün - Çekiş & Bacak',
        exercises: [
          { name: 'Plate Loaded Wide Grip Row', type: 'weight', sets: 3, reps: 8 },
          { name: 'Lat Pulldown', type: 'weight', sets: 3, reps: 8 },
          { name: 'Romanian Deadlift', type: 'weight', sets: 2, reps: 6 },
          { name: 'Cable Curl', type: 'weight', sets: 2, reps: 8 },
          { name: 'Hammer & Reverse Curl (Superset)', type: 'weight', sets: 2, reps: 10 },
          { name: 'Leg Extension', type: 'weight', sets: 2, reps: 8 },
          { name: 'Seated Leg Curl', type: 'weight', sets: 1, reps: 10 },
          { name: 'Standing Calf Raise', type: 'weight', sets: 3, reps: 10 },
          { name: 'Cable Crunch', type: 'weight', sets: 3, reps: 10 }
        ]
      },
      {
        dayName: '7. Gün - Aktif Dinlenme',
        exercises: []
      }
    ]
  },
  {
    id: 'stok_2',
    title: 'Yarı Maraton: 21.1 km Hazırlık',
    description: '100 günlük süreçte mesafeyi kademeli artıran 7 günlük koşu döngüsü.',
    days: [
      {
        dayName: '1. Gün - Hafif Tempo (Base Run)',
        exercises: [
          { name: 'Isınma Yürüyüşü', type: 'cardio', distance: 1, time: 10 },
          { name: 'Hafif Tempo Koşu (Zone 2)', type: 'cardio', distance: 4, time: 30 }
        ]
      },
      {
        dayName: '2. Gün - İnterval (Hız) Antrenmanı',
        exercises: [
          { name: 'Isınma Koşusu', type: 'cardio', distance: 2, time: 15 },
          { name: '400m Hızlı Koşu x 4 Set', type: 'cardio', distance: 1.6, time: 10 },
          { name: 'Soğuma Yürüyüşü', type: 'cardio', distance: 1, time: 10 }
        ]
      },
      {
        dayName: '3. Gün - Tam Dinlenme',
        exercises: []
      },
      {
        dayName: '4. Gün - Eşik (Tempo) Koşusu',
        exercises: [
          { name: 'Isınma Koşusu', type: 'cardio', distance: 1, time: 8 },
          { name: 'Hedef Yarı Maraton Temposunda Koşu', type: 'cardio', distance: 5, time: 35 },
          { name: 'Soğuma Yürüyüşü', type: 'cardio', distance: 1, time: 10 }
        ]
      },
      {
        dayName: '5. Gün - Çapraz Antrenman (Cross-Training)',
        exercises: [
          { name: 'İp Atlama veya Bisiklet', type: 'cardio', distance: 0, time: 30 }
        ]
      },
      {
        dayName: '6. Gün - Uzun Koşu (Long Run)',
        exercises: [
          { name: 'Haftanın Uzun Koşusu', type: 'cardio', distance: 8, time: 60 }
        ]
      },
      {
        dayName: '7. Gün - Aktif Dinlenme (Yürüyüş/Yoga)',
        exercises: []
      }
    ]
  }
];

function ProgramCard({ program, t, onPress, onDelete, isActive, onPressActive }) {
  return (
    <TouchableOpacity
      style={[styles.card, isActive && styles.cardActive]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Accent top border */}
      <View style={[styles.cardAccent, { backgroundColor: isActive ? '#00E5A0' : program.accentColor }]} />

      <View style={styles.cardContent}>
        {/* Left: Icon */}
        <View
          style={[
            styles.cardIcon,
            { backgroundColor: program.accentColor + '18' },
          ]}
        >
          <Ionicons
            name={program.icon.name}
            size={26}
            color={program.accentColor}
          />
        </View>

        {/* Center: Info */}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {program.name}
          </Text>
          {program.description ? (
            <Text style={styles.cardDescription} numberOfLines={1}>
              {program.description}
            </Text>
          ) : null}
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={Colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {`Haftada ${program.activeDays || 0} Gün`}
              </Text>
            </View>
            <View style={styles.metaDot} />
            <View style={styles.metaItem}>
              <Ionicons
                name="barbell-outline"
                size={13}
                color={Colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {`${program.totalExercises || 0} Egzersiz`}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Delete Button */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={(e) => {
            e.stopPropagation();
            onDelete(program.id);
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>

        {/* Right: Chevron */}
        <View style={styles.cardChevron}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textMuted}
          />
        </View>
      </View>

      {/* Bottom: Active Button */}
      <TouchableOpacity
        style={[styles.activeButton, isActive && styles.activeButtonDisabled]}
        activeOpacity={isActive ? 1 : 0.7}
        disabled={isActive}
        onPress={(e) => {
          e.stopPropagation();
          onPressActive();
        }}
      >
        <Text style={[styles.activeButtonText, isActive && styles.activeButtonTextDisabled]}>
          {isActive ? '✅ Aktif Program' : 'Aktif Yap'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function RoutinesScreen({ navigation }) {
  const { t } = useLanguage();
  const [programs, setPrograms] = useState([]);
  const [activeProgramId, setActiveProgramId] = useState(null);

  const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

  useFocusEffect(
    useCallback(() => {
      const loadRoutines = async () => {
        try {
          let routinesList = [];
          const savedData = await AsyncStorage.getItem(ROUTINES_STORAGE_KEY);
          if (savedData) {
            const parsed = JSON.parse(savedData);
            if (Array.isArray(parsed) && parsed.length > 0) {
              routinesList = parsed;
            }
          }

          // Fallback if empty
          if (routinesList.length === 0) {
            // Save main list dynamically adding app specific required fields
            routinesList = defaultPrograms.map((p, index) => ({
              id: p.id,
              name: p.title || p.name,
              description: p.description || '',
              icon: p.icon || PROGRAM_ICONS[index % PROGRAM_ICONS.length],
              accentColor: p.accentColor || PROGRAM_ICONS[index % PROGRAM_ICONS.length].color
            }));
            await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(routinesList));

            // Sync the skeleton days directly into separate storage keys and adapt user fields
            for (const prog of defaultPrograms) {
              if (prog.days) {
                for (let idx = 0; idx < prog.days.length; idx++) {
                  if (idx >= 7) break; // Maximum 7 days
                  const day = prog.days[idx];
                  const dayKey = DAY_NAMES[idx]; // 'Pazartesi', 'Salı', vs.

                  const mappedExercises = day.exercises.map((ex, exIndex) => {
                    const mappedEx = { id: `${prog.id}_${dayKey}_ex${exIndex}`, name: ex.name, completed: false };
                    if (ex.type === 'weight') {
                      mappedEx.exerciseType = 'weight';
                      mappedEx.sets = ex.sets ? ex.sets.toString() : '';
                      mappedEx.reps = ex.reps ? ex.reps.toString() : '';
                    } else if (ex.type === 'cardio') {
                      mappedEx.exerciseType = 'cardio';
                      if (ex.distance > 0) {
                         mappedEx.cardioTargetType = 'distance';
                         mappedEx.cardioTargetKm = ex.distance.toString();
                         mappedEx.cardioTargetMeters = '0';
                         mappedEx.cardioTargetMinutes = ex.time ? ex.time.toString() : '';
                      } else {
                         mappedEx.cardioTargetType = 'duration';
                         mappedEx.cardioTargetMinutes = ex.time ? ex.time.toString() : '';
                      }
                    } else {
                      mappedEx.exerciseType = ex.exerciseType || 'weight';
                    }
                    return mappedEx;
                  });
                  
                  await AsyncStorage.setItem(`@program_${prog.id}_${dayKey}`, JSON.stringify({ 
                    dayTitle: day.dayName, // Maps "1. Gün - İtiş" so it shows as title on the day card
                    exercises: mappedExercises 
                  }));
                }
              }
            }
          }

          // Her program için dinamik activeDays ve totalExercises hesapla
          const enrichedRoutines = await Promise.all(
            routinesList.map(async (program) => {
              let activeDays = 0;
              let totalExercises = 0;

              for (const dayName of DAY_NAMES) {
                try {
                  const key = `@program_${program.id}_${dayName}`;
                  const dayData = await AsyncStorage.getItem(key);
                  if (dayData) {
                    const parsed = JSON.parse(dayData);
                    if (parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
                      activeDays += 1;
                      totalExercises += parsed.exercises.length;
                    }
                  }
                } catch (_) {
                  // Tek bir gün okunamazsa devam et
                }
              }

              return { ...program, activeDays, totalExercises };
            })
          );

          setPrograms(enrichedRoutines);

          // Aktif program id'sini çek
          const storedActiveId = await AsyncStorage.getItem(ACTIVE_PROGRAM_KEY);
          if (storedActiveId) {
            setActiveProgramId(storedActiveId);
          } else if (enrichedRoutines.length > 0) {
            // Hiç aktif program yoksa ilkini aktif yap
            setActiveProgramId(enrichedRoutines[0].id);
            await AsyncStorage.setItem(ACTIVE_PROGRAM_KEY, enrichedRoutines[0].id);
          }
        } catch (error) {
          console.warn('Programlar yüklenirken hata:', error);
        }
      };

      loadRoutines();
    }, [t])
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineDescription, setNewRoutineDescription] = useState('');

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setNewRoutineName('');
    setNewRoutineDescription('');
  };

  const handleCreateRoutine = async () => {
    const trimmedName = newRoutineName.trim();
    if (!trimmedName) return;

    const randomIcon = PROGRAM_ICONS[programs.length % PROGRAM_ICONS.length];

    const newProgram = {
      id: Date.now().toString(),
      name: trimmedName,
      description: newRoutineDescription.trim() || '',
      activeDays: 0,
      totalExercises: 0,
      icon: randomIcon,
      accentColor: randomIcon.color,
    };

    const updatedList = [newProgram, ...programs];
    setPrograms(updatedList);

    try {
      await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedList));
    } catch (error) {
      console.warn('Yeni program kaydedilirken hata:', error);
    }

    handleCloseModal();
  };

  // Program Silme Mantığı (Platform Onaylı + AsyncStorage Entegrasyonu)
  const handleDeleteRoutine = (programId) => {
    const confirmMessage = 'Bu programı silmek istediğinize emin misiniz?';

    const performDelete = async () => {
      const updatedPrograms = programs.filter((p) => p.id !== programId);
      setPrograms(updatedPrograms);

      try {
        await AsyncStorage.setItem(ROUTINES_STORAGE_KEY, JSON.stringify(updatedPrograms));
      } catch (error) {
        console.warn('Program silinirken hata:', error);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Programı Sil',
        confirmMessage,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet', style: 'destructive', onPress: performDelete },
        ],
        { cancelable: true }
      );
    }
  };

  const handleProgramPress = (program) => {
    navigation.navigate('RoutineDetail', {
      programId: program.id,
      programName: program.name,
    });
  };

  const handleSetActiveProgram = async (programId) => {
    try {
      await AsyncStorage.setItem(ACTIVE_PROGRAM_KEY, programId);
      setActiveProgramId(programId);

      const successMessage = 'Program aktif olarak ayarlandı!';
      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Başarılı', successMessage);
      }
    } catch (error) {
      console.warn('Aktif program kaydedilirken hata:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>{t('screenTitles.routines')}</Text>
          <View style={styles.programCountBadge}>
            <Text style={styles.programCountText}>
              {t('routines.programCount', { count: programs.length })}
            </Text>
          </View>
        </View>
      </View>

      {/* Program List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>{t('routines.myPrograms')}</Text>

        {programs.map((program) => (
          <ProgramCard
            key={program.id}
            program={program}
            t={t}
            isActive={program.id === activeProgramId}
            onPress={() => handleProgramPress(program)}
            onDelete={handleDeleteRoutine}
            onPressActive={() => handleSetActiveProgram(program.id)}
          />
        ))}

        {/* Bottom spacer for FAB */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleOpenModal}
      >
        <View style={styles.fabGlow} />
        <Ionicons name="add" size={28} color={Colors.background} />
        <Text style={styles.fabText}>{t('routines.addNew')}</Text>
      </TouchableOpacity>

      {/* Slide-Up Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {/* Modal Header Handle */}
                <View style={styles.modalHandle} />

                <Text style={styles.modalTitle}>{t('routines.addNew')}</Text>

                {/* Input Fields */}
                <TextInput
                  style={styles.modalInput}
                  placeholder="Antrenman Adı, örn: Bacak Günü"
                  placeholderTextColor={Colors.textMuted}
                  value={newRoutineName}
                  onChangeText={setNewRoutineName}
                  autoFocus={true}
                />

                <TextInput
                  style={styles.modalInput}
                  placeholder="Açıklama (Örn: Kas büyümesi odaklı)"
                  placeholderTextColor={Colors.textMuted}
                  value={newRoutineDescription}
                  onChangeText={setNewRoutineDescription}
                />

                {/* Action Buttons */}
                <View style={styles.modalButtonContainer}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={handleCloseModal}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelButtonText}>
                      {t('common.cancel')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      styles.createButton,
                      !newRoutineName.trim() && styles.disabledButton,
                    ]}
                    onPress={handleCreateRoutine}
                    disabled={!newRoutineName.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.createButtonText}>
                      {t('common.save')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  programCountBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  programCountText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  // Scroll
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Section
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 14,
    marginLeft: 4,
  },

  // Program Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 14,
    overflow: 'hidden',
  },
  cardActive: {
    borderColor: '#00E5A0' + '60',
    borderWidth: 1.5,
  },
  cardAccent: {
    height: 3,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  cardIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 3,
  },
  cardDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.textMuted,
    marginHorizontal: 8,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
    marginRight: 6,
  },
  cardChevron: {
    marginLeft: 4,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeButton: {
    paddingVertical: 12,
    backgroundColor: Colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeButtonDisabled: {
    backgroundColor: 'rgba(0, 229, 160, 0.08)',
  },
  activeButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  activeButtonTextDisabled: {
    color: '#00E5A0',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
    // Shadow
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  fabGlow: {
    position: 'absolute',
    top: -6,
    left: -6,
    right: -6,
    bottom: -6,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    opacity: 0.12,
  },
  fabText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Bottom spacer
  bottomSpacer: {
    height: 100,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 40,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 18,
  },
  modalInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 24,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  createButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
