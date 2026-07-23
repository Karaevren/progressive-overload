import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, TextInput, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import { useSettings } from '../context/SettingsContext';

const SettingRow = ({ icon, title, subtitle, right, onPress }) => (
  <TouchableOpacity 
    style={styles.settingRow} 
    onPress={onPress}
    disabled={!onPress}
  >
    <View style={styles.settingIconContainer}>
      <Ionicons name={icon} size={20} color={Colors.primary} />
    </View>
    <View style={styles.settingTextContainer}>
      <Text style={styles.settingTitle}>{title}</Text>
      {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
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

  const [userName, setUserName] = useState('Ahmet Karaevren');
  const [profileData, setProfileData] = useState({ height: '' });
  const [userWeight, setUserWeight] = useState(77);
  const [userGoal, setUserGoal] = useState({ name: 'Denizli Lykos Yarı Maratonu', date: '2026-10-25' });
  const [inputName, setInputName] = useState('');
  const [inputWeight, setInputWeight] = useState('');

  const [isGoalModalVisible, setIsGoalModalVisible] = useState(false);
  const [goalInputName, setGoalInputName] = useState('');
  const [goalInputDate, setGoalInputDate] = useState('');

  useEffect(() => {
    loadProfileData();
  }, []);

  useEffect(() => {
    setInputName(userName);
  }, [userName]);

  useEffect(() => {
    // When settings change or weight changes, update the input string
    if (units === 'lb') {
      setInputWeight(Math.round(userWeight * 2.20462).toString());
    } else {
      setInputWeight(userWeight.toString());
    }
  }, [userWeight, units]);

  const loadProfileData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('@profile_name');
      const storedProfile = await AsyncStorage.getItem('@userProfile');
      const storedGoal = await AsyncStorage.getItem('@userGoal');
      
      if (storedName) {
        setUserName(storedName);
      }
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setProfileData({ height: parsed.height || '' });
        if (parsed.weight) {
          setUserWeight(parseFloat(parsed.weight));
        }
      }
      if (storedGoal) {
        setUserGoal(JSON.parse(storedGoal));
      }
    } catch (e) {
      console.error('Failed to load profile data', e);
    }
  };

  const saveName = async () => {
    try {
      const newName = inputName.trim() || 'Ahmet Karaevren';
      setUserName(newName);
      setInputName(newName);
      await AsyncStorage.setItem('@profile_name', newName);
    } catch (e) {
      console.error('Failed to save name', e);
    }
  };

  const saveProfileSettings = async () => {
    try {
      let weightVal = parseFloat(inputWeight);
      if (isNaN(weightVal) || weightVal <= 0) {
        weightVal = userWeight; // revert on invalid
      } else {
        if (units === 'lb') {
          weightVal = weightVal / 2.20462;
        }
      }
      setUserWeight(weightVal);

      await AsyncStorage.setItem('@userProfile', JSON.stringify({
        height: profileData.height,
        weight: weightVal.toString()
      }));
      Keyboard.dismiss();
      import('react-native').then(({ Alert }) => {
        Alert.alert('Başarılı', 'Fiziksel verileriniz kaydedildi!');
      });
    } catch (e) {
      console.error('Failed to save profile', e);
    }
  };

  const handleResetData = () => {
    import('react-native').then(({ Alert }) => {
      Alert.alert(
        'Emin misiniz?',
        'Tüm antrenman geçmişin ve programların kalıcı olarak silinecek!',
        [
          { text: 'İptal', style: 'cancel' },
          { 
            text: 'Evet, Sıfırla', 
            style: 'destructive',
            onPress: async () => {
              try {
                await AsyncStorage.clear();
                // State'leri boşalt/sıfırla
                setProfileData({ height: '' });
                setUserWeight(77);
                setUserName('Ahmet Karaevren');
                setInputName('Ahmet Karaevren');
                setUserGoal({ name: 'Hedef Belirlenmedi', date: '2026-10-25' });
                
                Alert.alert('Başarılı', 'Tüm veriler silindi. Lütfen değişikliklerin tam yansıması için uygulamayı kapatıp yeniden açın.');
              } catch (e) {
                console.error('Clear error', e);
              }
            }
          }
        ]
      );
    });
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
    const goalDate = new Date(userGoal.date + 'T00:00:00');
    if (isNaN(goalDate.getTime())) return 0;
    const today = new Date();
    const diffTime = goalDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleComingSoon = () => {
    import('react-native').then(({ Alert }) => {
      Alert.alert('Yakında', 'Bu özellik bir sonraki sürümde eklenecektir.');
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screenTitles.profile')}</Text>
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
          <Text style={styles.userName}>{userName}</Text>
          <Text style={styles.userStats}>Boy: {profileData.height || '180'} cm • Kilo: {formatWeight ? formatWeight(userWeight) : `${userWeight} kg`}</Text>
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
          <Text style={styles.goalSubtitle}>{userGoal.name}</Text>
          <View style={styles.goalCountdownBox}>
            <Text style={styles.goalCountdownText}>Kalan Süre: <Text style={{fontWeight: '800'}}>{getDaysLeft()} Gün</Text></Text>
          </View>
        </View>

        {/* Physical Data Section */}
        <Text style={styles.sectionTitle}>Fiziksel Veriler</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Boy</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.textInput, styles.weightInput]}
                value={profileData.height}
                onChangeText={(text) => setProfileData({...profileData, height: text})}
                keyboardType="numeric"
                placeholder="180"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>cm</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Kilo</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.textInput, styles.weightInput]}
                value={inputWeight}
                onChangeText={setInputWeight}
                keyboardType="numeric"
                placeholder="77"
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>{units}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.updateButton} onPress={saveProfileSettings} activeOpacity={0.8}>
            <Text style={styles.updateButtonText}>Güncelle</Text>
          </TouchableOpacity>
        </View>

        {/* Language Section */}
        <Text style={styles.sectionTitle}>{t('langSelector.title')}</Text>
        <View style={styles.card}>
          <View style={styles.languageContainer}>
            <TouchableOpacity 
              style={[
                styles.languageButton, 
                locale === 'tr' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('tr')}
            >
              <Text style={styles.languageEmoji}>🇹🇷</Text>
              <Text style={[
                styles.languageText,
                locale === 'tr' && styles.languageTextActive
              ]}>{t('langSelector.turkish')}</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.languageButton, 
                locale === 'en' && styles.languageButtonActive
              ]}
              onPress={() => changeLanguage('en')}
            >
              <Text style={styles.languageEmoji}>🇬🇧</Text>
              <Text style={[
                styles.languageText,
                locale === 'en' && styles.languageTextActive
              ]}>{t('langSelector.english')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Settings Section */}
        <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="notifications-outline"
            title={t('profile.notifications')}
            subtitle={t('profile.notificationsDesc')}
            onPress={handleComingSoon}
            right={
              <Switch
                value={notifications}
                onValueChange={handleComingSoon}
                trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                thumbColor={notifications ? Colors.primary : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon={darkMode ? "moon-outline" : "sunny-outline"}
            title={darkMode ? t('profile.darkMode') : t('profile.lightMode')}
            subtitle={darkMode ? t('profile.darkModeDesc') : t('profile.lightModeDesc')}
            onPress={handleComingSoon}
            right={
              <Switch
                value={darkMode}
                onValueChange={handleComingSoon}
                trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                thumbColor={darkMode ? Colors.primary : Colors.textMuted}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="barbell-outline"
            title={t('profile.units')}
            subtitle={t('profile.unitsDesc')}
            onPress={toggleUnits}
            right={
              <View style={styles.unitToggle}>
                <Text style={styles.unitToggleText}>{units.toUpperCase()}</Text>
                <Ionicons name="chevron-forward" size={20} color={Colors.textMuted} />
              </View>
            }
          />
        </View>

        {/* About Section */}
        <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
        <View style={styles.card}>
          <SettingRow
            icon="information-circle-outline"
            title={t('profile.appName')}
            right={<Text style={styles.versionText}>{t('profile.version')}</Text>}
          />
        </View>

        {/* Danger Zone */}
        <Text style={[styles.sectionTitle, { color: Colors.error }]}>Veri Yönetimi</Text>
        <TouchableOpacity 
          style={styles.dangerButton} 
          onPress={handleResetData}
          activeOpacity={0.8}
        >
          <Ionicons name="warning-outline" size={20} color={Colors.background} style={{ marginRight: 8 }} />
          <Text style={styles.dangerButtonText}>Tüm Verileri Sıfırla</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Goal Edit Modal */}
      {isGoalModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Hedefi Düzenle</Text>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Hedef Adı</Text>
              <TextInput
                style={styles.textInput}
                value={goalInputName}
                onChangeText={setGoalInputName}
                placeholder="Örn: Yarı Maraton"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.inputRow}>
              <Text style={styles.inputLabel}>Hedef Tarihi</Text>
              <TextInput
                style={styles.textInput}
                value={goalInputDate}
                onChangeText={setGoalInputDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalCancelButton} onPress={() => setIsGoalModalVisible(false)}>
                <Text style={styles.modalCancelText}>İptal</Text>
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
