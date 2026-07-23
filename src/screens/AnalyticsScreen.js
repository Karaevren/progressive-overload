import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useLanguage } from '../context/LanguageContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-gifted-charts';

export default function AnalyticsScreen() {
  const { t } = useLanguage();
  const [historyList, setHistoryList] = useState([]);
  const [uniqueExercises, setUniqueExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [chartData, setChartData] = useState([]);
  const [selectedTimeRange, setSelectedTimeRange] = useState('Son 1 Ay');
  
  // Yeni State'ler
  const [activeTab, setActiveTab] = useState('performance');
  const [consistencyStats, setConsistencyStats] = useState({ target: 0, completed: 0, percentage: 0, diff: 0 });
  const [heatmapData, setHeatmapData] = useState([]);
  
  const timeRanges = ['Son 1 Ay', 'Son 3 Ay', 'Son 6 Ay', 'Tümü'];

  const loadHistory = async () => {
    try {
      const data = await AsyncStorage.getItem('@workoutHistory');
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          setHistoryList(parsed);
          
          // Extract unique exercises
          const exerciseNames = new Set();
          parsed.forEach(record => {
            if (record.completedData) {
              Object.values(record.completedData).forEach(ex => {
                if (ex.name) {
                  exerciseNames.add(ex.name);
                }
              });
            }
          });
          
          const uniqueList = Array.from(exerciseNames).sort();
          setUniqueExercises(uniqueList);
          
          // Eğer önceden seçili hareket yoksa veya seçili hareket artık listede yoksa, ilki seç
          if (uniqueList.length > 0) {
            setSelectedExercise((prev) => (prev && uniqueList.includes(prev) ? prev : uniqueList[0]));
          }
          
          // --- DEVAMLILIK (CONSISTENCY) HESAPLAMASI ---
          const activeProgramId = await AsyncStorage.getItem('@activeProgramId');
          let activeDaysInWeek = 0;
          if (activeProgramId) {
            const DAY_NAMES = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
            for (const dayName of DAY_NAMES) {
              try {
                const dayData = await AsyncStorage.getItem(`@program_${activeProgramId}_${dayName}`);
                if (dayData) {
                  const dayParsed = JSON.parse(dayData);
                  if (dayParsed.exercises && dayParsed.exercises.length > 0) {
                    activeDaysInWeek++;
                  }
                }
              } catch (e) {}
            }
          }
          
          // Eğer program bulunamadıysa varsayılan 3 gün kabul et
          if (activeDaysInWeek === 0) activeDaysInWeek = 3;
          
          const targetWorkouts = Math.round(activeDaysInWeek * (30 / 7)); // Son 30 gün için hedef
          
          let completedWorkouts = 0;
          const now = new Date();
          parsed.forEach(record => {
            if (record.date) {
              const diffTime = Math.abs(now - new Date(record.date));
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays <= 30) {
                completedWorkouts++;
              }
            }
          });
          
          const percentage = targetWorkouts > 0 ? Math.round((completedWorkouts / targetWorkouts) * 100) : 0;
          const diff = targetWorkouts - completedWorkouts;
          
          setConsistencyStats({
            target: targetWorkouts,
            completed: completedWorkouts,
            percentage,
            diff
          });
          
          // --- HEATMAP (SON 100 GÜN) HESAPLAMASI ---
          const historyDateMap = {};
          parsed.forEach(record => {
            if (record.date) {
              const dateStr = record.date.split('T')[0];
              const exercisesCount = record.completedData ? Object.keys(record.completedData).length : 0;
              if (!historyDateMap[dateStr]) {
                historyDateMap[dateStr] = exercisesCount;
              } else {
                historyDateMap[dateStr] += exercisesCount;
              }
            }
          });

          const tempHeatmap = [];
          for (let i = 99; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const exCount = historyDateMap[dateStr] || 0;
            
            let intensity = 0;
            if (exCount > 0) {
              if (exCount <= 2) intensity = 1;
              else if (exCount <= 5) intensity = 2;
              else intensity = 3;
            }
            
            tempHeatmap.push({
              dateStr,
              isActive: exCount > 0,
              intensity,
              exercisesCount: exCount
            });
          }
          
          setHeatmapData(tempHeatmap);
        }
      }
    } catch (error) {
      console.warn('Geçmiş yüklenirken hata:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const injectMockData = async () => {
    try {
      const existingData = await AsyncStorage.getItem('@workoutHistory');
      let currentHistory = existingData ? JSON.parse(existingData) : [];

      const now = new Date();
      const mockRecords = [];
      const offsets = [28, 22, 16, 11, 5, 1]; // 4 haftaya dağılmış 6 gün
      const benchWeights = ["60", "65", "70", "75", "80", "85"];
      const barfiksReps = ["5", "6", "8", "10", "12", "15"];
      const runDistances = [
        { km: "3", m: "0" },
        { km: "4", m: "200" },
        { km: "5", m: "0" },
        { km: "6", m: "500" },
        { km: "7", m: "500" },
        { km: "8", m: "500" },
      ];

      for (let i = 0; i < 6; i++) {
        const d = new Date(now);
        d.setDate(d.getDate() - offsets[i]);
        
        mockRecords.push({
          id: `mock_workout_${i}_${Date.now()}`,
          date: d.toISOString(),
          dayTitle: `Test Günü ${i+1}`,
          completedData: {
            [`mock_bench_${i}`]: {
              name: 'Bench Press',
              exerciseType: 'weight',
              value: benchWeights[i],
              completed: true
            },
            [`mock_barfiks_${i}`]: {
              name: 'Barfiks',
              exerciseType: 'bodyweight',
              value: barfiksReps[i],
              completed: true
            },
            [`mock_run_${i}`]: {
              name: 'Koşu',
              exerciseType: 'cardio',
              cardioTargetType: 'distance',
              km: runDistances[i].km,
              meters: runDistances[i].m,
              completed: true
            }
          }
        });
      }

      // Mevcut verilerin en üstüne ekle (kronolojik olarak tersten de gidebiliriz ama grafikte düzelecek)
      const updatedHistory = [...mockRecords, ...currentHistory];
      await AsyncStorage.setItem('@workoutHistory', JSON.stringify(updatedHistory));
      
      loadHistory();
      Alert.alert('Başarılı', '🧪 Test verileri yüklendi!');
    } catch (error) {
      console.warn("Mock data error:", error);
    }
  };

  const formatChartDate = (isoString) => {
    const date = new Date(isoString);
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    return `${date.getDate()} ${months[date.getMonth()]}`;
  };

  useFocusEffect(
    useCallback(() => {
      if (!selectedExercise || historyList.length === 0) {
        setChartData([]);
        return;
      }

      // Filter and compute chart data for the selected exercise
      const dailyData = {};
      const now = new Date();
      let maxDays = 9999;
      if (selectedTimeRange === 'Son 1 Ay') maxDays = 30;
      else if (selectedTimeRange === 'Son 3 Ay') maxDays = 90;
      else if (selectedTimeRange === 'Son 6 Ay') maxDays = 180;
      
      historyList.forEach(record => {
        if (record.completedData && record.date) {
          const recordDate = new Date(record.date);
          const diffTime = Math.abs(now - recordDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= maxDays) {
            let dayTotal = 0;
            let hasDataForExercise = false;
            
            Object.values(record.completedData).forEach(ex => {
              if (ex.name === selectedExercise) {
                hasDataForExercise = true;
                if (ex.exerciseType === 'cardio') {
                   const km = parseFloat(ex.km || 0);
                   const meters = parseFloat(ex.meters || 0);
                   if (km > 0 || meters > 0) {
                      dayTotal += km + (meters / 1000);
                   }
                } else {
                   dayTotal += parseFloat(ex.value || 0);
                }
              }
            });

            if (hasDataForExercise && dayTotal > 0) {
              const dateStr = record.date.split('T')[0];
              if (!dailyData[dateStr]) {
                dailyData[dateStr] = { dateIso: record.date, total: 0 };
              }
              dailyData[dateStr].total += dayTotal;
            }
          }
        }
      });

      // Convert to array and sort by date ascending
      const dataPoints = Object.values(dailyData)
        .sort((a, b) => new Date(a.dateIso) - new Date(b.dateIso))
        .map(item => ({
          value: item.total,
          label: formatChartDate(item.dateIso),
          dataPointText: parseFloat(item.total.toFixed(2)).toString(),
        }));

      setChartData(dataPoints);
    }, [selectedExercise, historyList, selectedTimeRange])
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('screenTitles.analytics', { defaultValue: 'Gelişim' })}</Text>
        
        {/* Tab Segmented Control */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'performance' && styles.tabButtonActive]}
            onPress={() => setActiveTab('performance')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'performance' && styles.tabTextActive]}>Performans</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'consistency' && styles.tabButtonActive]}
            onPress={() => setActiveTab('consistency')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabText, activeTab === 'consistency' && styles.tabTextActive]}>Devamlılık</Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === 'performance' ? (
        <>
          {uniqueExercises.length > 0 && (
            <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pickerScroll}>
            {uniqueExercises.map((exName, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.pickerButton, selectedExercise === exName && styles.pickerButtonActive]}
                onPress={() => setSelectedExercise(exName)}
                activeOpacity={0.7}
              >
                <Text style={[styles.pickerButtonText, selectedExercise === exName && styles.pickerButtonTextActive]}>
                  {exName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <View style={styles.content}>
        {chartData.length > 0 ? (
          <View style={styles.chartWrapper}>
            <Text style={styles.chartTitle}>{selectedExercise} Gelişimi</Text>
            
            <View style={styles.timeFilterContainer}>
              {timeRanges.map((range, index) => (
                <TouchableOpacity
                  key={index}
                  style={[styles.timeFilterButton, selectedTimeRange === range && styles.timeFilterButtonActive]}
                  onPress={() => setSelectedTimeRange(range)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.timeFilterText, selectedTimeRange === range && styles.timeFilterTextActive]}>
                    {range}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            {(() => {
              const firstData = chartData[0]?.value || 0;
              const lastData = chartData[chartData.length - 1]?.value || 0;
              
              let percentage = 0;
              if (firstData > 0) {
                percentage = (((lastData - firstData) / firstData) * 100);
              }
              
              const isPositive = percentage > 0;
              const isNegative = percentage < 0;
              const percentColor = isPositive ? '#00E5A0' : (isNegative ? '#FF6B6B' : Colors.textSecondary);
              
              return (
                <View style={styles.chartRow}>
                  <View style={styles.chartArea}>
                    <LineChart
                      data={chartData}
                      width={180}
                      height={200}
                      spacing={45}
                      initialSpacing={15}
                      color={Colors.primary}
                      thickness={3}
                      dataPointsColor={Colors.primaryDark}
                      dataPointsRadius={4}
                      textShiftY={-12}
                      textShiftX={-5}
                      textColor={Colors.primaryDark}
                      textFontSize={10}
                      areaChart
                      startFillColor={Colors.primary}
                      endFillColor={Colors.background}
                      startOpacity={0.3}
                      endOpacity={0.0}
                      xAxisColor={Colors.border}
                      yAxisColor={Colors.border}
                      xAxisLabelTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                      yAxisTextStyle={{ color: Colors.textSecondary, fontSize: 10 }}
                      rulesColor={Colors.borderLight}
                      rulesType="solid"
                      isAnimated
                      animationDuration={800}
                    />
                  </View>
                  <View style={styles.summaryArea}>
                    <Text style={styles.summaryTitle}>Özet</Text>
                    <Text style={[styles.summaryPercent, { color: percentColor }]}>
                      {isPositive ? '+' : ''}{percentage.toFixed(1)}%
                    </Text>
                    <Text style={[styles.summaryStatus, { color: percentColor }]}>
                      {isPositive ? 'Artış' : (isNegative ? 'Düşüş' : 'Değişim Yok')}
                    </Text>
                    <View style={styles.summaryDivider} />
                    <Text style={styles.summarySubtext}>İlk: {parseFloat(firstData.toFixed(2))}</Text>
                    <Text style={styles.summarySubtext}>Son: {parseFloat(lastData.toFixed(2))}</Text>
                  </View>
                </View>
              );
            })()}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.iconContainer}>
              <View style={styles.iconGlow} />
              <Ionicons name="trending-up-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.placeholderText}>
              Henüz grafik oluşturmak için yeterli veri yok. Antrenman yapmaya devam et!
            </Text>
          </View>
        )}

            {/* Test Data Button */}
            <TouchableOpacity
              style={styles.mockDataButton}
              onPress={injectMockData}
              activeOpacity={0.8}
            >
              <Text style={styles.mockDataButtonText}>🧪 Test Verisi Yükle</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        // DEVAMLILIK (CONSISTENCY) VIEW
        <ScrollView style={styles.consistencyContainer} contentContainerStyle={styles.consistencyContent}>
          <Text style={styles.consistencyTitle}>Son 30 Gün Özeti</Text>
          
          <View style={styles.consistencyCard}>
            <View style={styles.consistencyIconWrapper}>
              <Ionicons name="flame" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.consistencyCardTitle}>Tamamlanma Oranı</Text>
            <Text style={styles.consistencyCardValue}>%{consistencyStats.percentage} Başarı</Text>
          </View>

          <View style={styles.consistencyCard}>
            <View style={[styles.consistencyIconWrapper, { backgroundColor: 'rgba(108, 99, 255, 0.15)' }]}>
              <Ionicons name="checkmark-circle" size={28} color="#6C63FF" />
            </View>
            <Text style={styles.consistencyCardTitle}>Tamamlanan Gün</Text>
            <Text style={styles.consistencyCardValue}>Bu ay {consistencyStats.completed} antrenman yapıldı</Text>
          </View>

          <View style={styles.consistencyCard}>
            <View style={[styles.consistencyIconWrapper, { backgroundColor: consistencyStats.diff <= 0 ? 'rgba(0, 229, 160, 0.15)' : 'rgba(255, 107, 107, 0.15)' }]}>
              <Ionicons name={consistencyStats.diff <= 0 ? "trophy" : "alert-circle"} size={28} color={consistencyStats.diff <= 0 ? "#00E5A0" : "#FF6B6B"} />
            </View>
            <Text style={styles.consistencyCardTitle}>Hedef Durumu</Text>
            <Text style={[styles.consistencyCardValue, { fontSize: 16, marginTop: 4, color: consistencyStats.diff <= 0 ? '#00E5A0' : '#FF6B6B' }]}>
              {consistencyStats.diff <= 0 
                ? 'Hedef aşıldı! Harika iş.' 
                : `Hedeflenen plandan ${consistencyStats.diff} gün eksik.`}
            </Text>
          </View>
          
          <Text style={[styles.consistencyTitle, { marginTop: 24 }]}>Antrenman Günlüğü</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.heatmapScroll}>
            <View style={styles.heatmapContainer}>
              {heatmapData.map((day, index) => {
                const getHeatmapColor = (intensity) => {
                  if (intensity === 0) return Colors.surfaceLight;
                  if (intensity === 1) return 'rgba(0, 229, 160, 0.3)';
                  if (intensity === 2) return 'rgba(0, 229, 160, 0.6)';
                  return 'rgba(0, 229, 160, 1.0)';
                };
                
                const handleHeatmapPress = () => {
                  const dateObj = new Date(day.dateStr);
                  const formattedDate = `${dateObj.getDate()} ${['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][dateObj.getMonth()]}`;
                  if (day.isActive) {
                    Alert.alert('Antrenman Günü', `${formattedDate} tarihinde ${day.exercisesCount} hareket tamamlandı.`);
                  } else {
                    Alert.alert('Dinlenme Günü', `${formattedDate} tarihinde antrenman yapılmadı.`);
                  }
                };

                return (
                  <TouchableOpacity 
                    key={index} 
                    style={[styles.heatmapSquare, { backgroundColor: getHeatmapColor(day.intensity) }]}
                    onPress={handleHeatmapPress}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
          </ScrollView>
          <View style={{height: 40}} />
        </ScrollView>
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
    marginBottom: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceLight,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tabTextActive: {
    color: Colors.background,
  },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  pickerScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  pickerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pickerButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pickerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pickerButtonTextActive: {
    color: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartWrapper: {
    flex: 1,
    width: '100%',
    padding: 20,
    paddingTop: 40,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
    textAlign: 'center',
  },
  timeFilterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
    flexWrap: 'wrap',
  },
  timeFilterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeFilterButtonActive: {
    backgroundColor: Colors.primaryGlow,
    borderColor: Colors.primary,
  },
  timeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeFilterTextActive: {
    color: Colors.primaryDark,
  },
  chartRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingVertical: 20,
    paddingLeft: 10,
    paddingRight: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  chartArea: {
    flex: 2,
    justifyContent: 'center',
    paddingRight: 10,
  },
  summaryArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
  },
  summaryTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryPercent: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  summaryStatus: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 12,
  },
  summaryDivider: {
    width: '80%',
    height: 1,
    backgroundColor: Colors.borderLight,
    marginBottom: 12,
  },
  summarySubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: 4,
  },
  emptyContainer: {
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
  placeholderText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: '500',
  },
  mockDataButton: {
    marginTop: 20,
    marginBottom: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0, 184, 212, 0.1)', // Subtle tint
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 212, 0.3)',
    alignSelf: 'center',
  },
  mockDataButtonText: {
    color: '#00B8D4',
    fontSize: 14,
    fontWeight: '700',
  },
  
  // Consistency Styles
  consistencyContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  consistencyContent: {
    padding: 24,
  },
  consistencyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 20,
  },
  consistencyCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  consistencyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryGlow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  consistencyCardTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  consistencyCardValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  heatmapScroll: {
    paddingVertical: 10,
  },
  heatmapContainer: {
    height: 115, 
    flexDirection: 'column',
    flexWrap: 'wrap',
    alignContent: 'flex-start',
  },
  heatmapSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
    margin: 2,
  },
});
