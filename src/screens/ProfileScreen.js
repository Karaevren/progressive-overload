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
  const [userWeight, setUserWeight] = useState(77); // Stored in kg

  const [inputName, setInputName] = useState('');
  const [inputWeight, setInputWeight] = useState('');

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
      const storedWeight = await AsyncStorage.getItem('@profile_weight');
      
      if (storedName) {
        setUserName(storedName);
      }
      if (storedWeight) {
        setUserWeight(parseFloat(storedWeight));
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

  const saveWeight = async () => {
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
      await AsyncStorage.setItem('@profile_weight', weightVal.toString());
      Keyboard.dismiss();
    } catch (e) {
      console.error('Failed to save weight', e);
    }
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
          <Text style={styles.userStats}>{formatWeight(userWeight)}</Text>
        </View>

        {/* Personal Info Section */}
        <Text style={styles.sectionTitle}>{t('profile.personalInfo')}</Text>
        <View style={styles.card}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('profile.name')}</Text>
            <TextInput
              style={styles.textInput}
              value={inputName}
              onChangeText={setInputName}
              onBlur={saveName}
              onEndEditing={saveName}
              placeholder={t('profile.nameInputPlaceholder')}
              placeholderTextColor={Colors.textMuted}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>{t('profile.weightLabel')}</Text>
            <View style={styles.weightInputContainer}>
              <TextInput
                style={[styles.textInput, styles.weightInput]}
                value={inputWeight}
                onChangeText={setInputWeight}
                onBlur={saveWeight}
                onEndEditing={saveWeight}
                keyboardType="numeric"
                placeholder={t('profile.weightInputPlaceholder')}
                placeholderTextColor={Colors.textMuted}
              />
              <View style={styles.unitBadge}>
                <Text style={styles.unitBadgeText}>{units}</Text>
              </View>
            </View>
          </View>
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
            right={
              <Switch
                value={notifications}
                onValueChange={toggleNotifications}
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
            right={
              <Switch
                value={darkMode}
                onValueChange={toggleDarkMode}
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

        <View style={styles.bottomPadding} />
      </ScrollView>
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
});

export default ProfileScreen;
