import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';

const PROGRAM_ICONS = [
  { name: 'flame-outline', color: '#FF6B6B' },
  { name: 'repeat-outline', color: '#6C63FF' },
  { name: 'heart-outline', color: '#00E5A0' },
];

function getMockPrograms(t) {
  return [
    {
      id: '1',
      name: t('routines.mockProgram1'),
      description: t('routines.mockProgram1Desc'),
      daysPerWeek: 5,
      exerciseCount: 25,
      icon: PROGRAM_ICONS[0],
      accentColor: '#FF6B6B',
    },
    {
      id: '2',
      name: t('routines.mockProgram2'),
      description: t('routines.mockProgram2Desc'),
      daysPerWeek: 3,
      exerciseCount: 18,
      icon: PROGRAM_ICONS[1],
      accentColor: '#6C63FF',
    },
    {
      id: '3',
      name: t('routines.mockProgram3'),
      description: t('routines.mockProgram3Desc'),
      daysPerWeek: 4,
      exerciseCount: 12,
      icon: PROGRAM_ICONS[2],
      accentColor: '#00E5A0',
    },
  ];
}

function ProgramCard({ program, t, onPress }) {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      {/* Accent top border */}
      <View style={[styles.cardAccent, { backgroundColor: program.accentColor }]} />

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
          <Text style={styles.cardDescription} numberOfLines={1}>
            {program.description}
          </Text>
          <View style={styles.cardMeta}>
            <View style={styles.metaItem}>
              <Ionicons
                name="calendar-outline"
                size={13}
                color={Colors.textSecondary}
              />
              <Text style={styles.metaText}>
                {t('routines.daysPerWeek', { count: program.daysPerWeek })}
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
                {t('routines.exercises', { count: program.exerciseCount })}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Chevron */}
        <View style={styles.cardChevron}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textMuted}
          />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function RoutinesScreen() {
  const { t } = useLanguage();
  const programs = getMockPrograms(t);

  const handleAddProgram = () => {
    Alert.alert(
      t('routines.addNew'),
      t('routines.addNewAlert'),
      [{ text: 'OK' }]
    );
  };

  const handleProgramPress = (program) => {
    console.log('Program selected:', program.name);
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
            onPress={() => handleProgramPress(program)}
          />
        ))}

        {/* Bottom spacer for FAB */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* FAB - Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={handleAddProgram}
      >
        <View style={styles.fabGlow} />
        <Ionicons name="add" size={28} color={Colors.background} />
        <Text style={styles.fabText}>{t('routines.addNew')}</Text>
      </TouchableOpacity>
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
  cardChevron: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: Colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
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
});
