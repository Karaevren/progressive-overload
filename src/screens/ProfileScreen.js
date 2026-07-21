import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

function SettingRow({ icon, iconColor, title, subtitle, right }) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + '20' }]}>
        <Ionicons name={icon} size={20} color={iconColor} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle ? <Text style={styles.settingSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.settingRight}>{right}</View>
    </View>
  );
}

export default function ProfileScreen() {
  const { t, locale, changeLanguage } = useLanguage();
  const isTurkish = locale === 'tr';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screenTitles.profile')}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatarGlow} />
            <View style={styles.avatar}>
              <Ionicons name="person" size={40} color={Colors.primary} />
            </View>
          </View>
          <Text style={styles.avatarName}>{t('profile.namePlaceholder')}</Text>
          <Text style={styles.avatarEmail}>{t('profile.emailPlaceholder')}</Text>
        </View>

        {/* Language Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('langSelector.title')}</Text>
          <View style={styles.card}>
            <View style={styles.languageToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.languageButton,
                  isTurkish && styles.languageButtonActive,
                ]}
                onPress={() => changeLanguage('tr')}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>🇹🇷</Text>
                <Text
                  style={[
                    styles.languageButtonText,
                    isTurkish && styles.languageButtonTextActive,
                  ]}
                >
                  {t('langSelector.turkish')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.languageButton,
                  !isTurkish && styles.languageButtonActive,
                ]}
                onPress={() => changeLanguage('en')}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text
                  style={[
                    styles.languageButtonText,
                    !isTurkish && styles.languageButtonTextActive,
                  ]}
                >
                  {t('langSelector.english')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="notifications-outline"
              iconColor={Colors.warning}
              title={t('profile.notifications')}
              subtitle={t('profile.notificationsDesc')}
              right={
                <Switch
                  value={true}
                  trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                  thumbColor={Colors.textPrimary}
                  ios_backgroundColor={Colors.border}
                />
              }
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="moon-outline"
              iconColor={Colors.secondary}
              title={t('profile.darkMode')}
              subtitle={t('profile.darkModeDesc')}
              right={
                <Switch
                  value={true}
                  trackColor={{ false: Colors.border, true: Colors.primaryDark }}
                  thumbColor={Colors.textPrimary}
                  ios_backgroundColor={Colors.border}
                />
              }
            />
            <View style={styles.settingDivider} />
            <SettingRow
              icon="scale-outline"
              iconColor={Colors.primary}
              title={t('profile.units')}
              subtitle={t('profile.unitsDesc')}
              right={
                <View style={styles.unitBadge}>
                  <Text style={styles.unitBadgeText}>kg</Text>
                </View>
              }
            />
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.about')}</Text>
          <View style={styles.card}>
            <SettingRow
              icon="information-circle-outline"
              iconColor={Colors.textSecondary}
              title={t('profile.appName')}
              subtitle={`${t('profile.version')} 1.0.0`}
              right={
                <Ionicons
                  name="chevron-forward"
                  size={18}
                  color={Colors.textMuted}
                />
              }
            />
          </View>
        </View>

        <View style={styles.bottomSpacer} />
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
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },

  // Avatar section
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primaryGlow,
    top: -5,
    left: -5,
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  avatarEmail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },

  // Section
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    marginLeft: 4,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },

  // Language toggle
  languageToggleContainer: {
    flexDirection: 'row',
    padding: 6,
  },
  languageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  languageButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  languageFlag: {
    fontSize: 20,
  },
  languageButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  languageButtonTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },

  // Setting rows
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  settingSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  settingRight: {
    marginLeft: 12,
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 66,
  },

  // Unit badge
  unitBadge: {
    backgroundColor: Colors.primaryGlow,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  unitBadgeText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },

  bottomSpacer: {
    height: 40,
  },
});
