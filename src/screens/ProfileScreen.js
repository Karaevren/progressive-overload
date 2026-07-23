import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Keyboard, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const SettingRow = ({ icon, title, subtitle, right, onPress, themeStyles }) => (
  <TouchableOpacity 
    style={styles.settingRow} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text style={[styles.settingTitle, themeStyles && { color: themeStyles.text }]}>{title}</Text>
      {subtitle && <Text style={[styles.settingSubtitle, themeStyles && { color: themeStyles.textSec }]}>{subtitle}</Text>}
    </View>
    {right && <View style={styles.settingRight}>{right}</View>}
  </TouchableOpacity>
);

const ProfileScreen = () => {
  const { t, locale, changeLanguage } = useLanguage();
  const { 
    units, 
    darkMode, 
    notifications, 
    toggleUnits, 
    toggleDarkMode, 
    toggleNotifications,
    formatWeight,
    convertWeight
  } = useSettings();

  const [userName, setUserName] = useState('');
  const [userHeight, setUserHeight] = useState('');
  const [userWeight, setUserWeight] = useState(77);
  const [userGoal, setUserGoal] = useState({ name: 'Hedef Belirlenmedi', date: '' });
  const [inputWeight, setInputWeight] = useState('');

  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalInputName, setGoalInputName] = useState('');
  const [goalInputDate, setGoalInputDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [localNotifications, setLocalNotifications] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    if (userWeight === 0) {
      setInputWeight('');
    } else if (units === 'lb') {
      setInputWeight(Math.round(userWeight * 2.20462).toString());
    } else {
      setInputWeight(userWeight.toString());
    }
  }, [userWeight, units]);

  const loadProfileData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('@userName');
      const storedHeight = await AsyncStorage.getItem('@userHeight');
      const storedWeight = await AsyncStorage.getItem('@userWeight');
      const storedProfile = await AsyncStorage.getItem('@userProfile');
      const storedGoal = await AsyncStorage.getItem('@userGoal');
      const storedNotif = await AsyncStorage.getItem('@notifications_enabled');
      
      if (storedName) setUserName(storedName);
      if (storedNotif) setLocalNotifications(storedNotif === 'true');
      
      // Önce ayrı key'lerden oku, yoksa eski @userProfile'dan oku (geriye uyumluluk)
      if (storedHeight) {
        setUserHeight(storedHeight);
      } else if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.height) setUserHeight(parsed.height);
      }
      
      if (storedWeight) {
        setUserWeight(parseFloat(storedWeight));
      } else if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        if (parsed.weight) setUserWeight(parseFloat(parsed.weight));
      }
      
      if (storedGoal) setUserGoal(JSON.parse(storedGoal));
    } catch (e) {
      console.error('Failed to load profile data', e);
    }
  };

  const saveProfileSettings = async () => {
    try {
      // Kilo: Boş bırakılmışsa 0 olarak kaydet, eski değere dönme
      let weightVal;
      const trimmedWeight = inputWeight.trim();
      if (trimmedWeight === '') {
        weightVal = 0;
      } else {
        weightVal = parseFloat(trimmedWeight);
        if (isNaN(weightVal) || weightVal < 0) weightVal = 0;
        else if (units === 'lb') weightVal = weightVal / 2.20462;
      }
      
      setUserWeight(weightVal);
      
      // Boy: Boş bırakılmışsa boş string olarak kaydet
      const heightToSave = userHeight.trim();
      
      await AsyncStorage.setItem('@userHeight', heightToSave);
      await AsyncStorage.setItem('@userWeight', weightVal > 0 ? weightVal.toString() : '');
      await AsyncStorage.setItem('@userProfile', JSON.stringify({ height: heightToSave, weight: weightVal > 0 ? weightVal.toString() : '' }));
      await AsyncStorage.setItem('@userName', userName.trim());
      Keyboard.dismiss();
      Alert.alert('Başarılı', 'Fiziksel verileriniz ve isminiz kaydedildi!');
    } catch (e) {
      console.error(e);
    }
  };

  const saveGoal = async () => {
    try {
      const updatedGoal = {
        name: goalInputName.trim() || 'Hedef Belirlenmedi',
        date: goalInputDate.trim() || '2026-10-25'
      };
      setUserGoal(updatedGoal);
      await AsyncStorage.setItem('@userGoal', JSON.stringify(updatedGoal));
      setIsGoalModalVisible(false);
    } catch (e) {
      console.error(e);
    }
  };

  const getDaysLeft = () => {
    if (!userGoal.date) return 0;
    const goalDate = new Date(userGoal.date + 'T00:00:00');
    if (isNaN(goalDate.getTime())) return 0;
    const today = new Date();
    const diffTime = goalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleToggleNotifications = async (value) => {
    if (value) {
      try {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Reddedildi', 'Bildirim gönderebilmek için ayarlardan izin vermelisiniz.');
          setLocalNotifications(false);
          return;
        }
        await Notifications.scheduleNotificationAsync({
          content: { title: "Antrenman Vakti! 🏋️‍♂️", body: "Bugün hedeflerine bir adım daha yaklaş." },
          trigger: { type: 'daily', hour: 9, minute: 0 },
        });
        await AsyncStorage.setItem('@notifications_enabled', 'true');
        setLocalNotifications(true);
      } catch (err) {
        console.warn('Bildirim zamanlama hatası:', err);
        try {
          await Notifications.scheduleNotificationAsync({
            content: { title: "Antrenman Vakti! 🏋️‍♂️", body: "Bugün hedeflerine bir adım daha yaklaş." },
            trigger: { seconds: 60 * 60 * 24, repeats: true },
          });
        } catch (_) {}
        await AsyncStorage.setItem('@notifications_enabled', 'true');
        setLocalNotifications(true);
      }
    } else {
      // Kapatma: Doğrudan state güncelle, OS izin kontrolü yapma
      setLocalNotifications(false);
      await AsyncStorage.setItem('@notifications_enabled', 'false');
      try {
        await Notifications.cancelAllScheduledNotificationsAsync();
      } catch (_) {}
    }
  };

  const themeStyles = {
    bg: Colors.background,
    surface: Colors.surface,
    text: Colors.textPrimary,
    textSec: Colors.textSecondary,
    border: Colors.border,
    inputBg: Colors.surfaceLight,
  };

  return (
    <View style={[styles.container, { backgroundColor: themeStyles.bg }]}>
      <View style={[styles.header, { backgroundColor: themeStyles.surface, borderBottomColor: themeStyles.border }]}>
        <Text style={[styles.headerTitle, { color: themeStyles.text }]}>{t('screenTitles.profile')}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Avatar Section */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
          </View>
          <TextInput 
            style={[styles.userName, { color: themeStyles.text, minWidth: 150, textAlign: 'center', marginHorizontal: 20 }]}
            value={userName}
            onChangeText={setUserName}
            placeholder="İsminizi Girin"
            placeholderTextColor={Colors.textMuted}
            onEndEditing={saveProfileSettings}
          />
          <Text style={[styles.userStats, { color: themeStyles.textSec }]}>Boy: {userHeight || '-'} cm • Kilo: {formatWeight ? formatWeight(userWeight) : `${userWeight} kg`}</Text>
        </View>

        {/* Big Goal Card (Geri Sayım) */}
        <View style={styles.goalCard}>
          <View style={styles.goalHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="trophy" size={24} color="#FFB84D" />
              <Text style={styles.goalTitle}>Sıradaki Büyük Hedef</Text>
            </View>
            <TouchableOpacity 
              style={styles.goalEditButton} 
              onPress={() => {
                setGoalInputName(userGoal.name);
                setGoalInputDate(userGoal.date);
                setIsGoalModalVisible(true);
              }}
            >
              <Ionicons name="pencil" size={18} color="#FFB84D" />
            </TouchableOpacity>
          </View>
          <Text style={[styles.goalSubtitle, { color: themeStyles.text }]}>{userGoal.name}</Text>
          <View style={[styles.goalCountdownBox, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
            <Text style={[styles.goalCountdownText, { color: themeStyles.text }]}>Kalan Süre: <Text style={{fontWeight: '800'}}>{getDaysLeft()} Gün</Text></Text>
          </View>
        </View>

        {/* Physical Data Section */}
        <Text style={[styles.sectionTitle, { color: themeStyles.textSec }]}>Fiziksel Veriler</Text>
        <View style={[styles.card, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: themeStyles.text }]}>Boy</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.textInput, styles.weightInput, { backgroundColor: themeStyles.inputBg, color: themeStyles.text }]}
                value={userHeight}
                onChangeText={setUserHeight}
                keyboardType="numeric"
                placeholder="180"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={[styles.unitBadge, { backgroundColor: themeStyles.border }]}>
                <Text style={[styles.unitBadgeText, { color: themeStyles.textSec }]}>cm</Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: themeStyles.border }]} />

          <View style={styles.inputRow}>
            <Text style={[styles.inputLabel, { color: themeStyles.text }]}>Kilo</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.textInput, styles.weightInput, { backgroundColor: themeStyles.inputBg, color: themeStyles.text }]}
                value={inputWeight}
                onChangeText={setInputWeight}
                keyboardType="numeric"
                placeholder="77"
                placeholderTextColor={Colors.textMuted}
                onEndEditing={saveProfileSettings}
              />
              <View style={[styles.unitBadge, { backgroundColor: themeStyles.border }]}>
                <Text style={[styles.unitBadgeText, { color: themeStyles.textSec }]}>{units}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={saveProfileSettings} activeOpacity={0.8}>
            <Text style={styles.updateButtonText}>Güncelle</Text>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <Text style={[styles.sectionTitle, { color: themeStyles.textSec }]}>{t('langSelector.title')}</Text>
        <View style={[styles.card, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
          <View style={styles.languageContainer}>
            <TouchableOpacity 
              style={[
                styles.languageButton, 
                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border },
                locale === 'tr' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('tr')}
            >
              <Text style={styles.languageEmoji}>🇹🇷</Text>
              <Text style={[
                styles.languageText, { color: themeStyles.textSec },
                locale === 'tr' && styles.languageTextActive
              ]}>{t('langSelector.turkish')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageButton, 
                { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border },
                locale === 'en' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.languageEmoji}>🇬🇧</Text>
              <Text style={[
                styles.languageText, { color: themeStyles.textSec },
                locale === 'en' && styles.languageTextActive
              ]}>{t('langSelector.english')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={[styles.sectionTitle, { color: themeStyles.textSec }]}>{t('profile.settings')}</Text>
        <View style={[styles.card, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
          <SettingRow
            themeStyles={themeStyles}
            icon="notifications-outline"
            title={t('profile.notifications')}
            subtitle={t('profile.notificationsDesc')}
            right={
              <Switch
                value={localNotifications}
                onValueChange={handleToggleNotifications}
                trackColor={{ false: themeStyles.border, true: Colors.primaryDark }}
                thumbColor={localNotifications ? Colors.primary : Colors.textMuted}
              />
            }
          />
          <View style={[styles.divider, { backgroundColor: themeStyles.border }]} />
          <SettingRow
            themeStyles={themeStyles}
            icon="barbell-outline"
            title={t('profile.units')}
            subtitle={t('profile.unitsDesc')}
            onPress={toggleUnits}
            right={
              <View style={[styles.unitToggle, { backgroundColor: themeStyles.inputBg }]}>
                <Text style={[styles.unitToggleText, { color: themeStyles.text }]}>{units.toUpperCase()}</Text>
                <Ionicons name="chevron-forward" size={20} color={themeStyles.textSec} />
              </View>
            }
          />
        </View>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: themeStyles.textSec }]}>{t('profile.about')}</Text>
        <View style={[styles.card, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
          <SettingRow
            themeStyles={themeStyles}
            icon="information-circle-outline"
            title={t('profile.appName')}
            right={<Text style={styles.versionText}>{t('profile.version')}</Text>}
          />
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Goal Edit Modal */}
      {isGoalModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: themeStyles.surface, borderColor: themeStyles.border }]}>
            <Text style={[styles.modalTitle, { color: themeStyles.text }]}>Hedefi Düzenle</Text>
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeStyles.text }]}>Hedef Adı</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: themeStyles.inputBg, color: themeStyles.text }]}
                value={goalInputName}
                onChangeText={setGoalInputName}
                placeholder="Örn: Yarı Maraton"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={[styles.inputLabel, { color: themeStyles.text }]}>Hedef Tarihi</Text>
              {Platform.OS === 'web' ? (
                <View style={{ flex: 2 }}>
                  {React.createElement('input', {
                    type: 'date',
                    value: goalInputDate,
                    onChange: (e) => setGoalInputDate(e.target.value),
                    style: {
                      padding: '10px 16px',
                      borderRadius: '12px',
                      border: 'none',
                      backgroundColor: themeStyles.inputBg,
                      color: themeStyles.text,
                      fontSize: '16px',
                      width: '100%',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }
                  })}
                </View>
              ) : (
                <View style={{ flex: 2 }}>
                  <TouchableOpacity 
                    style={[styles.textInput, { flex: 0, justifyContent: 'center', backgroundColor: themeStyles.inputBg }]} 
                    onPress={() => setShowDatePicker(true)}
                  >
                    <Text style={{ color: themeStyles.text }}>{goalInputDate || 'Tarih Seç'}</Text>
                  </TouchableOpacity>
                  
                  {showDatePicker && (
                    <DateTimePicker
                      value={new Date(goalInputDate || new Date())}
                      mode="date"
                      display="default"
                      onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) setGoalInputDate(selectedDate.toISOString().split('T')[0]);
                      }}
                    />
                  )}
                </View>
              )}
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalCancelButton, { backgroundColor: themeStyles.inputBg, borderColor: themeStyles.border }]} onPress={() => setIsGoalModalVisible(false)}>
                <Text style={[styles.modalCancelText, { color: themeStyles.textSec }]}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveButton} onPress={saveGoal}>
                <Text style={styles.modalSaveText}>Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

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
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
  },
  scrollContent: {
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryGlow,
    transform: [{ scale: 1.2 }],
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  userStats: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
    marginTop: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 4,
  },
  inputLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    flex: 1,
  },
  textInput: {
    backgroundColor: Colors.surfaceLight,
    color: Colors.textPrimary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    flex: 2,
  },
  weightInputContainer: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightInput: {
    flex: 1,
  },
  unitBadge: {
    backgroundColor: Colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 8,
  },
  unitBadgeText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  languageButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  languageEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  languageText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  languageTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  settingIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  settingRight: {
    marginLeft: 16,
  },
  unitToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unitToggleText: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginRight: 4,
  },
  versionText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  bottomPadding: {
    height: 40,
  },
  goalCard: {
    backgroundColor: 'rgba(255, 184, 77, 0.1)',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#FFB84D',
    shadowColor: '#FFB84D',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFB84D',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  goalEditButton: {
    padding: 4,
  },
  goalSubtitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  goalCountdownBox: {
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  goalCountdownText: {
    fontSize: 20,
    color: Colors.textPrimary,
  },
  updateButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    color: Colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  dangerButton: {
    flexDirection: 'row',
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.error,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  dangerButtonText: {
    color: Colors.background,
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    padding: 24,
    borderRadius: 16,
    width: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  modalCancelButton: {
    flex: 1,
    backgroundColor: Colors.surfaceLight,
    paddingVertical: 12,
    borderRadius: 12,
    marginRight: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalSaveButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontWeight: '600',
    fontSize: 15,
  },
  modalSaveText: {
    color: Colors.background,
    fontWeight: '700',
    fontSize: 15,
  },
});

export default ProfileScreen;
