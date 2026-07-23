import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList, TextInput, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function WorkoutScreen() {
  const { t } = useLanguage();
  const { formatWeight } = useSettings();

  const [todayTitle, setTodayTitle] = useState('');
  const [todayExercises, setTodayExercises] = useState([]);
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [isWorkoutFinished, setIsWorkoutFinished] = useState(false);

  // State: Tamamlanan hareketler ve girilen değerler (Obj yapısı: { [exerciseId]: { value: string, completed: boolean } })
  const [completedExercises, setCompletedExercises] = useState({});

  // Yardımcı Fonksiyon: Bugünün adını Türkçe olarak bul
  const getTodayName = () => {
    const days = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
    return days[new Date().getDay()];
  };

  useFocusEffect(
    useCallback(() => {
      const loadTodayWorkout = async () => {
        try {
          // Önce @activeProgramId'den oku, yoksa ilk programı kullan
          let activeProgramId = null;
          const storedActiveId = await AsyncStorage.getItem('@activeProgramId');
          if (storedActiveId) {
            activeProgramId = storedActiveId;
          } else {
            const routinesData = await AsyncStorage.getItem('@routines_list');
            if (routinesData) {
              const routines = JSON.parse(routinesData);
              if (routines && routines.length > 0) {
                activeProgramId = routines[0].id;
              }
            }
          }

          let currentDayTitle = '';

          if (activeProgramId) {
            const todayName = getTodayName();
            const storageKey = `@program_${activeProgramId}_${todayName}`;

            const dayData = await AsyncStorage.getItem(storageKey);
            if (dayData) {
              const parsed = JSON.parse(dayData);
              currentDayTitle = parsed.dayTitle || '';
              setTodayTitle(currentDayTitle);

              if (parsed.exercises && Array.isArray(parsed.exercises)) {
                setTodayExercises(parsed.exercises);
              } else {
                setTodayExercises([]);
              }
            } else {
              setTodayTitle('');
              setTodayExercises([]);
            }
          }

          // Geçmişi kontrol et: Bugünün tarihi ve başlığıyla eşleşen bir kayıt var mı?
          const historyData = await AsyncStorage.getItem('@workoutHistory');
          if (historyData) {
            const historyList = JSON.parse(historyData);
            if (Array.isArray(historyList)) {
              const todayStr = new Date().toISOString().split('T')[0];
              const matchingRecord = historyList.find((record) => {
                const recordDate = record.date ? record.date.split('T')[0] : '';
                return recordDate === todayStr && record.dayTitle === (currentDayTitle || getTodayName());
              });

              if (matchingRecord) {
                setIsWorkoutFinished(true);
                if (matchingRecord.completedData) {
                  setCompletedExercises(matchingRecord.completedData);
                }
              } else {
                setIsWorkoutFinished(false);
                setCompletedExercises({});
              }
            } else {
              setIsWorkoutFinished(false);
              setCompletedExercises({});
            }
          } else {
            setIsWorkoutFinished(false);
            setCompletedExercises({});
          }
        } catch (error) {
          console.warn('Bugünün programı yüklenirken hata oluştu:', error);
        }
      };

      // Odaklanıldığında antrenman aktifliğini sıfırla
      setIsWorkoutActive(false);
      loadTodayWorkout();
    }, [])
  );

  const handleUpdateValue = (exerciseId, field, text) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setCompletedExercises((prev) => {
      const prevData = prev[exerciseId] || { completed: false };
      return {
        ...prev,
        [exerciseId]: {
          ...prevData,
          [field]: numericValue,
        },
      };
    });
  };

  const toggleExerciseCompleted = (exerciseId, item) => {
    const exerciseType = item.exerciseType || 'weight';
    const current = completedExercises[exerciseId] || { value: '', completed: false };

    // Tamamlanmamışsa ve tamamlamaya çalışıyorsa: boş değer validasyonu
    if (!current.completed) {
      if (exerciseType === 'cardio') {
        let isInvalid = false;
        let message = '';
        if (item.cardioTargetType === 'distance') {
          // Asking for Duration (hours/minutes)
          const h = parseInt(current.hours || '0', 10);
          const m = parseInt(current.minutes || '0', 10);
          if (h === 0 && m === 0) {
            isInvalid = true;
            message = 'Lütfen gerçekleşen süreyi girin (0 olamaz).';
          }
        } else {
          // Asking for Distance (km/meters)
          const km = parseInt(current.km || '0', 10);
          const meters = parseInt(current.meters || '0', 10);
          if (km === 0 && meters === 0) {
            isInvalid = true;
            message = 'Lütfen gerçekleşen mesafeyi girin (0 olamaz).';
          }
        }
        if (isInvalid) {
          if (Platform.OS === 'web') window.alert(message);
          else Alert.alert('Uyarı', message);
          return;
        }
      } else {
        const val = current.value ? current.value.trim() : '';
        if (!val || val === '0') {
          let message = exerciseType === 'weight'
            ? 'Lütfen geçerli bir çalışma ağırlığı girin (0 olamaz).'
            : 'Lütfen geçerli bir tekrar sayısı girin (0 olamaz).';
          if (Platform.OS === 'web') window.alert(message);
          else Alert.alert('Uyarı', message);
          return;
        }
      }
    }

    setCompletedExercises((prev) => {
      const curr = prev[exerciseId] || { value: '', completed: false };
      return {
        ...prev,
        [exerciseId]: {
          ...curr,
          completed: !curr.completed,
        },
      };
    });
  };

  // Antrenmanı Gerçek Olarak Kaydetme Fonksiyonu
  const handleFinishWorkout = async () => {
    // 1. En az bir tamamlanmış hareket var mı kontrolü
    const completedKeys = Object.keys(completedExercises).filter(
      (key) => completedExercises[key].completed
    );

    // 2. Verisi girilmiş ama onaylanmamış hareket var mı kontrolü
    const hasUnconfirmedData = Object.keys(completedExercises).some((key) => {
      const ex = completedExercises[key];
      if (ex.completed) return false;
      const hasValue = (ex.value && ex.value.trim() !== '') || 
                       (ex.km && ex.km.trim() !== '') || 
                       (ex.meters && ex.meters.trim() !== '') || 
                       (ex.hours && ex.hours.trim() !== '') || 
                       (ex.minutes && ex.minutes.trim() !== '');
      return hasValue;
    });

    if (hasUnconfirmedData) {
      const message = 'Lütfen verisini girdiğiniz hareketleri tikleyerek onaylayın.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Uyarı', message);
      }
      return;
    }

    if (completedKeys.length === 0) {
      const message = 'Lütfen antrenmanı bitirmeden önce en az bir hareketi tamamlayın.';
      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Uyarı', message);
      }
      return;
    }

    // Sadece onaylanmış (completed: true) hareketleri filtrele
    const confirmedData = {};
    for (const key of completedKeys) {
      const exerciseTemplate = todayExercises.find((ex) => ex.id === key);
      confirmedData[key] = {
        ...completedExercises[key],
        name: exerciseTemplate ? exerciseTemplate.name : 'Bilinmeyen Hareket',
        exerciseType: exerciseTemplate ? (exerciseTemplate.exerciseType || 'weight') : 'weight',
      };
    }

    try {
      // 2. AsyncStorage'dan mevcut geçmişi çek
      const historyData = await AsyncStorage.getItem('@workoutHistory');
      let historyList = [];
      if (historyData) {
        const parsedHistory = JSON.parse(historyData);
        if (Array.isArray(parsedHistory)) {
          historyList = parsedHistory;
        }
      }

      let updatedHistory;

      if (isWorkoutFinished) {
        // Düzenleme modu: Bugünün mevcut kaydını güncelle
        const todayStr = new Date().toISOString().split('T')[0];
        const targetTitle = todayTitle || getTodayName();
        updatedHistory = historyList.map((record) => {
          const recordDate = record.date ? record.date.split('T')[0] : '';
          if (recordDate === todayStr && record.dayTitle === targetTitle) {
            return { ...record, completedData: confirmedData };
          }
          return record;
        });
      } else {
        // 3. Yeni kayıt objesi oluştur
        const newWorkoutRecord = {
          id: Date.now().toString(),
          date: new Date().toISOString(),
          dayTitle: todayTitle || getTodayName(),
          completedData: confirmedData,
        };

        // 4. Dizinin başına ekleyip kaydet
        updatedHistory = [newWorkoutRecord, ...historyList];
      }

      await AsyncStorage.setItem('@workoutHistory', JSON.stringify(updatedHistory));

      // 5. State'leri güncelle
      setIsWorkoutActive(false);
      setIsWorkoutFinished(true);

      // 6. Web/Mobil uyumlu Başarı Bildirimi
      const successMessage = isWorkoutFinished
        ? 'Değişiklikler başarıyla kaydedildi.'
        : 'Tebrikler! Antrenman başarıyla kaydedildi.';
      if (Platform.OS === 'web') {
        window.alert(successMessage);
      } else {
        Alert.alert('Başarılı', successMessage);
      }
    } catch (error) {
      console.warn('Antrenman geçmişi kaydedilirken hata oluştu:', error);
      const errorMessage = 'Kayıt sırasında bir hata oluştu.';
      if (Platform.OS === 'web') {
        window.alert(errorMessage);
      } else {
        Alert.alert('Hata', errorMessage);
      }
    }
  };

  const todayDate = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const todayNameStr = getTodayName();
  const displayTitle = todayTitle ? `${todayNameStr} - ${todayTitle}` : todayNameStr;

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.iconContainer}>
        <View style={styles.iconGlow} />
        <Ionicons name="cafe-outline" size={60} color={Colors.primary} />
      </View>
      <Text style={styles.emptyTitle}>Off Day!</Text>
      <Text style={styles.emptyText}>Bugün için planlanmış bir antrenman yok. Dinlenme günü!</Text>
    </View>
  );

  const renderStartScreen = () => (
    <View style={styles.startScreenContainer}>
      <Text style={styles.startTitle}>{displayTitle}</Text>
      <Text style={styles.startSubtitle}>
        {isWorkoutFinished ? 'Bugünkü Antrenmanı Tamamladın' : `Toplam ${todayExercises.length} Hareket`}
      </Text>

      <TouchableOpacity
        style={[styles.startBigButton, isWorkoutFinished && { backgroundColor: Colors.primaryDark || '#1a8a5c' }]}
        onPress={() => setIsWorkoutActive(true)}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isWorkoutFinished ? 'create-outline' : 'play'}
          size={24}
          color={Colors.background}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.startBigButtonText}>
          {isWorkoutFinished ? 'Ağırlıkları Düzenle' : 'Antrenmana Başla'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderExercise = ({ item }) => {
    const exerciseState = completedExercises[item.id] || { value: '', completed: false };
    const isCompleted = exerciseState.completed;
    const exerciseType = item.exerciseType || 'weight';

    // Tip bazlı dinamik label, birim ve ikon (Çapraz Kardiyo Mantığı dahil)
    let config;
    if (exerciseType === 'cardio') {
      // Çapraz sorgu: hedef mesafe ise süre sor, hedef süre ise mesafe sor
      if (item.cardioTargetType === 'distance') {
        config = { label: 'Gerçekleşen Süre', unit: 'Dk', icon: 'time-outline' };
      } else {
        config = { label: 'Gerçekleşen Mesafe', unit: 'km', icon: 'navigate-outline' };
      }
    } else if (exerciseType === 'bodyweight') {
      config = { label: 'Yapılan Toplam Tekrar', unit: 'Adet', icon: 'body-outline' };
    } else {
      config = { label: 'Çalışma Ağırlığı', unit: 'kg', icon: 'barbell-outline' };
    }

    return (
      <View style={[styles.cardContainer, isCompleted && styles.cardContainerCompleted]}>
        <View style={[styles.cardAccent, { backgroundColor: isCompleted ? Colors.primaryDark : Colors.primary }]} />
        <View style={styles.cardContent}>
          <Text style={[styles.exerciseName, isCompleted && styles.exerciseNameCompleted]}>{item.name}</Text>

          <View style={styles.metaRow}>
            {exerciseType === 'cardio' ? (
              <>
                <Text style={[styles.metaText, isCompleted && styles.metaTextMuted]}>
                  {item.cardioTargetType === 'distance' 
                    ? `Hedef: ${item.cardioTargetKm > 0 ? item.cardioTargetKm + ' KM ' : ''}${item.cardioTargetMeters > 0 ? item.cardioTargetMeters + ' Metre' : ''}`.trim() || 'Hedef: 0 KM'
                    : `Hedef: ${item.cardioTargetHours > 0 ? item.cardioTargetHours + ' Saat ' : ''}${item.cardioTargetMinutes > 0 ? item.cardioTargetMinutes + ' Dk' : ''}`.trim() || 'Hedef: 0 Dk'}
                </Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={[styles.metaTextRir, isCompleted && styles.metaTextMuted]}>
                  {item.cardioTargetType === 'distance' ? 'Mesafe Hedefli' : 'Süre Hedefli'}
                </Text>
              </>
            ) : (
              <>
                {exerciseType === 'weight' && item.rir !== undefined && item.rir !== '' && (
                  <>
                    <Text style={[styles.metaTextRir, isCompleted && styles.metaTextMuted]}>
                      {item.rir === '0' ? 'Tükeniş' : `RIR: ${item.rir}`}
                    </Text>
                    <Text style={styles.metaDot}>•</Text>
                  </>
                )}
                <Text style={[styles.metaText, isCompleted && styles.metaTextMuted]}>Hedef: {item.sets} Set</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={[styles.metaText, isCompleted && styles.metaTextMuted]}>{item.reps} Tekrar</Text>
              </>
            )}
          </View>

          {/* Dinamik Giriş Tasarımı */}
          {exerciseType === 'cardio' ? (
            <View style={[styles.dualInputRow, isCompleted && styles.singleInputRowCompleted]}>
              <View style={styles.weightLabelContainer}>
                <Ionicons name={config.icon} size={18} color={isCompleted ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.weightLabelText, isCompleted && styles.weightLabelTextCompleted]}>
                  {config.label}
                </Text>
              </View>

              <View style={styles.dualInputsContainer}>
                {item.cardioTargetType === 'distance' ? (
                  // Süre sor: Saat ve Dakika
                  <>
                    <View style={styles.inputWrapperSmall}>
                      <TextInput
                        style={[styles.weightInputSmall, isCompleted && styles.weightInputCompleted]}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                        value={exerciseState.hours}
                        onChangeText={(text) => handleUpdateValue(item.id, 'hours', text)}
                        editable={!isCompleted}
                      />
                      <Text style={[styles.unitText, isCompleted && styles.unitTextCompleted]}>Saat</Text>
                    </View>
                    <Text style={styles.colonSeparator}>:</Text>
                    <View style={styles.inputWrapperSmall}>
                      <TextInput
                        style={[styles.weightInputSmall, isCompleted && styles.weightInputCompleted]}
                        placeholder="00"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                        value={exerciseState.minutes}
                        onChangeText={(text) => handleUpdateValue(item.id, 'minutes', text)}
                        editable={!isCompleted}
                      />
                      <Text style={[styles.unitText, isCompleted && styles.unitTextCompleted]}>Dk</Text>
                    </View>
                  </>
                ) : (
                  // Mesafe sor: KM ve Metre
                  <>
                    <View style={styles.inputWrapperSmall}>
                      <TextInput
                        style={[styles.weightInputSmall, isCompleted && styles.weightInputCompleted]}
                        placeholder="0"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                        value={exerciseState.km}
                        onChangeText={(text) => handleUpdateValue(item.id, 'km', text)}
                        editable={!isCompleted}
                      />
                      <Text style={[styles.unitText, isCompleted && styles.unitTextCompleted]}>KM</Text>
                    </View>
                    <Text style={styles.colonSeparator}>.</Text>
                    <View style={styles.inputWrapperSmall}>
                      <TextInput
                        style={[styles.weightInputSmall, isCompleted && styles.weightInputCompleted]}
                        placeholder="000"
                        keyboardType="numeric"
                        placeholderTextColor={Colors.textMuted}
                        value={exerciseState.meters}
                        onChangeText={(text) => handleUpdateValue(item.id, 'meters', text)}
                        editable={!isCompleted}
                      />
                      <Text style={[styles.unitText, isCompleted && styles.unitTextCompleted]}>Metre</Text>
                    </View>
                  </>
                )}
              </View>

              <TouchableOpacity
                style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
                onPress={() => toggleExerciseCompleted(item.id, item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isCompleted ? "checkmark-done-sharp" : "checkmark"}
                  size={22}
                  color={isCompleted ? Colors.background : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.singleInputRow, isCompleted && styles.singleInputRowCompleted]}>
              <View style={styles.weightLabelContainer}>
                <Ionicons name={config.icon} size={18} color={isCompleted ? Colors.primary : Colors.textSecondary} />
                <Text style={[styles.weightLabelText, isCompleted && styles.weightLabelTextCompleted]}>
                  {config.label}
                </Text>
              </View>

              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.weightInput, isCompleted && styles.weightInputCompleted]}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor={Colors.textMuted}
                  value={exerciseState.value}
                  onChangeText={(text) => handleUpdateValue(item.id, 'value', text)}
                  editable={!isCompleted}
                />
                <Text style={[styles.unitText, isCompleted && styles.unitTextCompleted]}>{config.unit}</Text>
              </View>

              <TouchableOpacity
                style={[styles.checkButton, isCompleted && styles.checkButtonActive]}
                onPress={() => toggleExerciseCompleted(item.id, item)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isCompleted ? "checkmark-done-sharp" : "checkmark"}
                  size={22}
                  color={isCompleted ? Colors.background : Colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderHeader = () => {
    if (!isWorkoutActive) return null;

    return (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screenTitles.workout', { defaultValue: 'Antrenman' })}</Text>
        <Text style={styles.headerSubtitle}>{todayDate}</Text>

        {todayTitle ? (
          <View style={styles.todayTitleBadge}>
            <Ionicons name="flash-outline" size={14} color={Colors.primary} />
            <Text style={styles.todayTitleText}>{todayTitle}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {renderHeader()}

      {todayExercises.length === 0 ? (
        renderEmptyState()
      ) : !isWorkoutActive ? (
        renderStartScreen()
      ) : (
        <FlatList
          data={todayExercises}
          keyExtractor={(item, idx) => item.id || idx.toString()}
          renderItem={renderExercise}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            <TouchableOpacity
              style={styles.finishButton}
              onPress={handleFinishWorkout}
              activeOpacity={0.8}
            >
              <Text style={styles.finishButtonText}>
                {isWorkoutFinished
                  ? 'Değişiklikleri Kaydet'
                  : t('workout.finishWorkout', { defaultValue: 'Antrenmanı Bitir' })}
              </Text>
            </TouchableOpacity>
          }
        />
      )}
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
  todayTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
    gap: 6,
  },
  todayTitleText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty State
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    marginTop: -50,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  iconGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryGlow,
    opacity: 0.4,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },

  // Start Screen
  startScreenContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    marginTop: -50,
  },
  startTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  startSubtitle: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 40,
    fontWeight: '500',
  },
  startBigButton: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  startBigButtonText: {
    color: Colors.background,
    fontSize: 20,
    fontWeight: 'bold',
  },

  // List & Cards
  listContent: {
    paddingTop: 10,
    paddingBottom: 40,
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
  cardContainerCompleted: {
    backgroundColor: Colors.surface + '80',
    borderColor: Colors.primary + '40',
    opacity: 0.85,
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
  exerciseNameCompleted: {
    color: Colors.textSecondary,
    textDecorationLine: 'line-through',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  metaText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  metaTextMuted: {
    color: Colors.textMuted,
  },
  metaTextRir: {
    color: '#FF6B6B',
    fontSize: 14,
    fontWeight: '600',
  },
  metaDot: {
    color: Colors.textMuted,
    fontSize: 14,
    marginHorizontal: 8,
  },

  // Single Input Row UI
  singleInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  singleInputRowCompleted: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary + '30',
  },
  weightLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weightLabelText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  weightLabelTextCompleted: {
    color: Colors.primary,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weightInput: {
    color: Colors.textPrimary,
    paddingVertical: 8,
    fontSize: 16,
    fontWeight: '700',
    width: 50,
    textAlign: 'center',
  },
  weightInputCompleted: {
    color: Colors.primary,
    backgroundColor: 'transparent',
  },
  unitText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
    marginLeft: 2,
    flexShrink: 0,
  },
  unitTextCompleted: {
    color: Colors.primary,
  },
  // Dual Input Row Styles (Kardiyo)
  dualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: 8,
  },
  dualInputsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
    marginRight: 6,
    gap: 8,
  },
  inputWrapperSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: Colors.border,
    minWidth: 55,
  },
  weightInputSmall: {
    color: Colors.textPrimary,
    paddingVertical: 6,
    fontSize: 14,
    fontWeight: '700',
    width: 30,
    textAlign: 'center',
  },
  colonSeparator: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textMuted,
    marginHorizontal: 4,
  },
  checkButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  checkButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },

  // Finish Button
  finishButton: {
    backgroundColor: Colors.primary,
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 18,
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
