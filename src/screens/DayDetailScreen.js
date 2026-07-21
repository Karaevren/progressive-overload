import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';

function ExerciseCard({ item, onDelete }) {
  const isFailure = item.rir === '0';

  return (
    <View style={styles.exerciseCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.exerciseName}>{item.name}</Text>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(item.id)}
          activeOpacity={0.7}
        >
          <Ionicons name="trash-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.badgeContainer}>
        <View style={styles.badge}>
          <Ionicons name="layers-outline" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>{item.sets} Set</Text>
        </View>

        <View style={styles.badge}>
          <Ionicons name="repeat-outline" size={14} color={Colors.primary} />
          <Text style={styles.badgeText}>{item.reps} Tekrar</Text>
        </View>

        {item.rir !== undefined && item.rir !== '' && (
          <View style={[styles.badge, isFailure && styles.badgeFailure]}>
            <Ionicons
              name={isFailure ? 'flame' : 'speedometer-outline'}
              size={14}
              color={isFailure ? '#FF6B6B' : Colors.primary}
            />
            <Text style={[styles.badgeText, isFailure && styles.badgeTextFailure]}>
              {isFailure ? 'Tükeniş (RIR 0)' : `RIR: ${item.rir}`}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

export default function DayDetailScreen({ route, navigation }) {
  const { programId, programName, dayName } = route.params || {
    programId: 'default',
    programName: 'Program Detayı',
    dayName: 'Gün Detayı',
  };

  const STORAGE_KEY = `@program_${programId}_${dayName}`;

  // State
  const [dayTitle, setDayTitle] = useState('');
  const [exercises, setExercises] = useState([]);

  // Modal & Form State
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');
  const [rir, setRir] = useState('');

  // Sayfa yüklendiğinde AsyncStorage'dan veriyi oku
  useEffect(() => {
    const loadDayData = async () => {
      try {
        const savedData = await AsyncStorage.getItem(STORAGE_KEY);
        if (savedData) {
          const parsed = JSON.parse(savedData);
          if (parsed.dayTitle !== undefined) {
            setDayTitle(parsed.dayTitle);
          }
          if (Array.isArray(parsed.exercises)) {
            setExercises(parsed.exercises);
          }
        }
      } catch (error) {
        console.warn('Gün verisi yüklenirken hata oluştu:', error);
      }
    };

    loadDayData();
  }, [STORAGE_KEY]);

  const handleOpenModal = () => {
    setIsModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsModalVisible(false);
    setExerciseName('');
    setSets('');
    setReps('');
    setRir('');
  };

  const handleSaveExercise = () => {
    if (!exerciseName.trim()) return;

    const newExercise = {
      id: Date.now().toString(),
      name: exerciseName.trim(),
      sets: sets.trim() || '1',
      reps: reps.trim() || '1',
      rir: rir.trim(),
    };

    setExercises((prev) => [...prev, newExercise]);
    handleCloseModal();
  };

  // Silme Fonksiyonu (Web/Mobil Onay + State + Otomatik AsyncStorage Kaydı)
  const handleDeleteExercise = (exerciseId) => {
    const confirmMessage = 'Bu hareketi silmek istediğinize emin misiniz?';

    const performDelete = async () => {
      const updatedExercises = exercises.filter((ex) => ex.id !== exerciseId);
      setExercises(updatedExercises);

      try {
        const dataToSave = {
          dayTitle,
          exercises: updatedExercises,
        };
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
      } catch (error) {
        console.warn('Hareket silinirken kaydetme hatası:', error);
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(confirmMessage);
      if (confirmed) {
        performDelete();
      }
    } else {
      Alert.alert(
        'Hareketi Sil',
        confirmMessage,
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Evet', style: 'destructive', onPress: performDelete },
        ],
        { cancelable: true }
      );
    }
  };

  // Gerçek Kaydetme İşlemi (Header Butonu)
  const handleSaveDay = async () => {
    try {
      const dataToSave = {
        dayTitle,
        exercises,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
    } catch (error) {
      console.warn('Gün verisi kaydedilirken hata oluştu:', error);
    }
    navigation.goBack();
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
          {dayName}
        </Text>

        <TouchableOpacity
          style={styles.saveHeaderButton}
          onPress={handleSaveDay}
          activeOpacity={0.7}
        >
          <Text style={styles.saveHeaderText}>Kaydet</Text>
        </TouchableOpacity>
      </View>

      {/* Day Title Input Container */}
      <View style={styles.dayTitleContainer}>
        <Text style={styles.dayTitleLabel}>GÜN BAŞLIĞI</Text>
        <TextInput
          style={styles.dayTitleInput}
          placeholder="Örn: İtiş, Bacak, Off Day..."
          placeholderTextColor={Colors.textMuted}
          value={dayTitle}
          onChangeText={setDayTitle}
        />
      </View>

      {/* Exercises List / Empty State */}
      {exercises.length === 0 ? (
        <View style={styles.emptyContent}>
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow} />
            <Ionicons name="barbell-outline" size={60} color={Colors.primary} />
          </View>
          <Text style={styles.emptyStateText}>
            Henüz hareket eklenmedi.
          </Text>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ExerciseCard item={item} onDelete={handleDeleteExercise} />
          )}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Add Exercise Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleOpenModal}
      >
        <View style={styles.fabGlow} />
        <Ionicons name="add" size={28} color={Colors.background} />
        <Text style={styles.fabText}>Hareket Ekle</Text>
      </TouchableOpacity>

      {/* Add Exercise Modal */}
      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.keyboardAvoidingView}
            >
              <TouchableWithoutFeedback>
                <View style={styles.modalContent}>
                  {/* Modal Header Handle */}
                  <View style={styles.modalHandle} />

                  <Text style={styles.modalTitle}>Hareket Ekle</Text>

                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* Exercise Name Input */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Hareket Adı</Text>
                      <TextInput
                        style={styles.modalInput}
                        placeholder="örn: Bench Press"
                        placeholderTextColor={Colors.textMuted}
                        value={exerciseName}
                        onChangeText={setExerciseName}
                      />
                    </View>

                    {/* Sets, Reps & RIR Inputs Row */}
                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Set Sayısı</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="4"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={sets}
                          onChangeText={(text) => setSets(text.replace(/[^0-9]/g, ''))}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>Tekrar Sayısı</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="12"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={reps}
                          onChangeText={(text) => setReps(text.replace(/[^0-9]/g, ''))}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>RIR</Text>
                        <TextInput
                          style={styles.modalInput}
                          placeholder="RIR (Örn: 1)"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={rir}
                          onChangeText={(text) => setRir(text.replace(/[^0-9]/g, ''))}
                        />
                      </View>
                    </View>

                    {/* RIR Information Subtext */}
                    <Text style={styles.rirInfoText}>
                      RIR: Set bittiğinde yapabileceğiniz fazladan tekrar sayısıdır (0 = Tam Tükeniş)
                    </Text>

                    {/* Action Buttons */}
                    <View style={styles.modalButtonContainer}>
                      <TouchableOpacity
                        style={[styles.modalButton, styles.cancelButton]}
                        onPress={handleCloseModal}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.cancelButtonText}>İptal</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.modalButton,
                          styles.saveButton,
                          !exerciseName.trim() && styles.disabledButton,
                        ]}
                        onPress={handleSaveExercise}
                        disabled={!exerciseName.trim()}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.saveButtonText}>Kaydet</Text>
                      </TouchableOpacity>
                    </View>
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
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
  saveHeaderButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  saveHeaderText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  dayTitleContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  dayTitleLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  dayTitleInput: {
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '600',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
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
  emptyStateText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  exerciseCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deleteButton: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: Colors.error + '15',
  },
  badgeContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  badgeFailure: {
    backgroundColor: 'rgba(255, 107, 107, 0.15)',
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  badgeTextFailure: {
    color: '#FF6B6B',
  },
  fab: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    gap: 8,
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34,
    borderWidth: 1,
    borderColor: Colors.border,
    maxHeight: '85%',
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
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  rirInfoText: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 18,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
    marginBottom: 10,
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
  saveButton: {
    backgroundColor: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
});
