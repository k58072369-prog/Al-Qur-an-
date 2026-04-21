import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, Vibration, View } from 'react-native';
import { getSurahById, SURAHS } from '../../data/quranMeta';
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from '../../theme';
import { TaskSelection } from '../../types';
import { formatTime } from '../../utils/helpers';

type TaskTimerProps = {
  initialSeconds: number;
  onFinish: () => void;
  onClose: () => void;
  title: string;
  task?: TaskSelection;
  showRepetition?: boolean;
  showControls?: boolean;
  showSetup?: boolean;
};

const STROKE_WIDTH = 12;

export function TaskTimer({ 
  initialSeconds, 
  onFinish, 
  onClose, 
  title, 
  task, 
  showRepetition = true,
  showControls = true,
  showSetup = true
}: TaskTimerProps) {
  const Colors = useTheme();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  // New States for enhanced session control
  const [currentRep, setCurrentRep] = useState(0);
  const [currentAyah, setCurrentAyah] = useState<{surahId: number, ayah: number} | null>(null);
  const [currentPage, setCurrentPage] = useState<number | null>(null);
  const [pageRange, setPageRange] = useState<{min: number, max: number}>({ min: 1, max: 604 });

  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Initialize from task if available
  useEffect(() => {
    if (task && task.ranges.length > 0) {
      const firstRange = task.ranges[0];
      if (firstRange.type === 'surah' && firstRange.surahId) {
        setCurrentAyah({ surahId: firstRange.surahId, ayah: firstRange.startAyah || 1 });
      }
      
      // Calculate min/max pages from all ranges
      const allPages: number[] = [];
      task.ranges.forEach(r => {
        if (r.type === 'page') {
          for (let p = r.start; p <= r.end; p++) allPages.push(p);
        } else if (r.type === 'surah' && r.surahId) {
          const surah = getSurahById(r.surahId);
          if (surah) {
            for (let p = surah.startPage; p <= surah.endPage; p++) allPages.push(p);
          }
        }
      });

      if (allPages.length > 0) {
        const minP = Math.min(...allPages);
        const maxP = Math.max(...allPages);
        setPageRange({ min: minP, max: maxP });
        setCurrentPage(minP);
      }
    }
  }, [task]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      Vibration.vibrate([0, 500, 200, 500]);
      onFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialSeconds);
    setIsActive(false);
    setIsFinished(false);
    setCurrentRep(0);
  };

  const percentage = initialSeconds > 0 ? seconds / initialSeconds : 0;

  // Circular progress clipping logic
  const getRotation = (p: number) => `${p * 180 - 180}deg`;
  const rightHalfPct = percentage <= 0.5 ? percentage * 2 : 1;
  const leftHalfPct = percentage > 0.5 ? (percentage - 0.5) * 2 : 0;

  const handleNextAyah = () => {
    setCurrentAyah(prev => {
      if (!prev) return { surahId: 1, ayah: 1 };
      const surah = getSurahById(prev.surahId);
      if (surah && prev.ayah < surah.ayahCount) {
        return { ...prev, ayah: prev.ayah + 1 };
      }
      return prev;
    });
    setCurrentRep(0);
  };

  const handlePrevAyah = () => {
    setCurrentAyah(prev => {
      if (!prev || prev.ayah <= 1) return prev;
      return { ...prev, ayah: prev.ayah - 1 };
    });
    setCurrentRep(0);
  };

  return (
    <View style={styles.overlay}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        style={[styles.container, { backgroundColor: Colors.background }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Background Decorative Circles */}
        <View style={[styles.decorCircle, { top: -50, left: -50, backgroundColor: Colors.primarySubtle }]} />
        <View style={[styles.decorCircle, { bottom: -100, right: -50, backgroundColor: Colors.primarySubtle, width: 300, height: 300 }]} />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: isActive ? Colors.primaryMuted : Colors.glass }]}>
             <Text style={[styles.badgeText, { color: isActive ? Colors.primary : Colors.textTertiary }]}>
                {isActive ? 'جاري الآن' : 'متوقف'}
             </Text>
          </View>
        </View>

        {/* Initial Setup Section - Only visible before start */}
        {showSetup && !isActive && !isFinished && (
          <View style={styles.setupCard}>
            <Text style={[styles.setupTitle, { color: Colors.textSecondary }]}>إعداد البداية</Text>
            <View style={styles.setupRow}>
              <View style={styles.setupItem}>
                <Text style={styles.setupLabel}>رقم الآية</Text>
                <TextInput
                  style={[styles.setupInput, { color: Colors.textPrimary, borderColor: Colors.border }]}
                  keyboardType="numeric"
                  placeholder="رقم.."
                  placeholderTextColor={Colors.textTertiary}
                  value={currentAyah ? currentAyah.ayah.toString() : ""}
                  onChangeText={(val) => {
                    const num = parseInt(val);
                    if (!isNaN(num)) {
                      setCurrentAyah(prev => ({ surahId: prev?.surahId || 1, ayah: num }));
                    } else if (val === "") {
                      setCurrentAyah(prev => prev ? { ...prev, ayah: 0 } : null);
                    }
                  }}
                />
              </View>
              <View style={styles.setupItem}>
                <Text style={styles.setupLabel}>رقم الصفحة</Text>
                <TextInput
                  style={[styles.setupInput, { color: Colors.textPrimary, borderColor: Colors.border }]}
                  keyboardType="numeric"
                  placeholder="رقم.."
                  placeholderTextColor={Colors.textTertiary}
                  value={currentPage ? currentPage.toString() : ""}
                  onChangeText={(val) => {
                    const num = parseInt(val);
                    if (!isNaN(num)) {
                      setCurrentPage(num);
                    } else if (val === "") {
                      setCurrentPage(null);
                    }
                  }}
                />
              </View>
            </View>
          </View>
        )}
        
        <Animated.View style={[
          styles.timerContainer, 
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <View style={styles.circularContainer}>
            {/* Background Track Ring */}
            <View style={[styles.trackRing, { borderColor: Colors.borderLight }]} />

            {/* Right Half */}
            <View style={styles.halfContainer}>
              <View style={[styles.halfInner, { overflow: 'hidden' }]}>
                <View style={[
                  styles.progressHalf, 
                  { 
                    borderColor: 'transparent', 
                    borderRightColor: Colors.primary, 
                    borderTopColor: Colors.primary,
                    transform: [{ rotate: '-45deg' }, { rotate: getRotation(rightHalfPct) }]
                  }
                ]} />
              </View>
            </View>

            {/* Left Half */}
            <View style={[styles.halfContainer, { flexDirection: 'row' }]}>
              <View style={[styles.halfInner, { overflow: 'hidden' }]}>
                <View style={[
                  styles.progressHalf, 
                  { 
                    borderColor: 'transparent', 
                    borderLeftColor: leftHalfPct > 0 ? Colors.primary : 'transparent', 
                    borderBottomColor: leftHalfPct > 0 ? Colors.primary : 'transparent',
                    transform: [{ rotate: '-45deg' }, { rotate: getRotation(leftHalfPct) }],
                    left: 0,
                    right: undefined
                  }
                ]} />
              </View>
            </View>

            {/* Center Content */}
            <View style={[styles.timerCircle, { backgroundColor: Colors.surface }]}>
              <Text style={[styles.timeText, { color: isFinished ? Colors.success : Colors.textPrimary }]}>
                {formatTime(seconds)}
              </Text>
              <Text style={[styles.remainingLabel, { color: Colors.textTertiary }]}>المتبقي</Text>
            </View>
          </View>
        </Animated.View>

        {/* Dynamic controls for Hifz - Vertical Stack (Reordered) */}
        {showControls && (
          <View style={styles.hifzControls}>
          {currentAyah && (
            <Text style={[styles.surahName, { color: Colors.primary }]}>
              {getSurahById(currentAyah.surahId)?.nameAr}
            </Text>
          )}

          <View style={styles.hifzStack}>
             {/* 1. Page Control with Range Logic */}
             <View style={styles.stackedItem}>
                <Text style={[styles.hifzLabel, { color: Colors.textTertiary }]}>رقم الصفحة</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity 
                    onPress={() => setCurrentPage(prev => prev ? Math.max(pageRange.min, prev - 1) : pageRange.min)} 
                    style={[styles.largeMiniBtn, currentPage === pageRange.min && { opacity: 0.3 }]}
                    disabled={currentPage === pageRange.min}
                  >
                    <Ionicons name="remove-circle-outline" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.hifzValueLarge, { color: Colors.textPrimary }]}>{currentPage || '-'}</Text>
                  <TouchableOpacity 
                    onPress={() => setCurrentPage(prev => prev ? Math.min(pageRange.max, prev + 1) : pageRange.min)} 
                    style={[styles.largeMiniBtn, currentPage === pageRange.max && { opacity: 0.3 }]}
                    disabled={currentPage === pageRange.max}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
             </View>

             <View style={styles.stackDivider} />

             {/* 2. Ayah Control */}
             <View style={styles.stackedItem}>
                <Text style={[styles.hifzLabel, { color: Colors.textTertiary }]}>رقم الآية</Text>
                <View style={styles.counterRow}>
                  <TouchableOpacity onPress={handlePrevAyah} style={styles.largeMiniBtn}>
                    <Ionicons name="remove-circle-outline" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={[styles.hifzValueLarge, { color: Colors.textPrimary }]}>
                    {currentAyah ? currentAyah.ayah : '-'}
                  </Text>
                  <TouchableOpacity onPress={handleNextAyah} style={styles.largeMiniBtn}>
                    <Ionicons name="add-circle-outline" size={24} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
             </View>

             {showRepetition && (
               <>
                 <View style={styles.stackDivider} />

                 {/* 3. Repetition Control */}
                 <View style={styles.stackedItem}>
                    <Text style={[styles.hifzLabel, { color: Colors.textTertiary }]}>عدد التكرار</Text>
                    <View style={styles.counterRow}>
                      <TouchableOpacity onPress={() => setCurrentRep(prev => Math.max(0, prev - 1))} style={styles.largeMiniBtn}>
                        <Ionicons name="remove-circle-outline" size={24} color={Colors.textPrimary} />
                      </TouchableOpacity>
                      <Text style={[styles.hifzValueLarge, { color: Colors.textPrimary }]}>{currentRep}x</Text>
                      <TouchableOpacity onPress={() => setCurrentRep(prev => prev + 1)} style={styles.largeMiniBtn}>
                        <Ionicons name="add-circle-outline" size={24} color={Colors.textPrimary} />
                      </TouchableOpacity>
                    </View>
                 </View>
               </>
             )}
             </View>
          </View>
        )}

        <View style={styles.controls}>
          {!isFinished ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: isActive ? Colors.warning : Colors.primary }, Shadow.md]} 
              onPress={toggle}
            >
              <Ionicons name={isActive ? "pause" : "play"} size={24} color="#FFF" />
              <Text style={styles.btnText}>{isActive ? "إيقاف مؤقت" : "ابدأ الجلسة"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: Colors.success }, Shadow.md]} 
              onPress={onClose}
            >
              <Ionicons name="checkmark-done" size={24} color="#FFF" />
              <Text style={styles.btnText}>إكمال الورد</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="refresh" size={16} color={Colors.textTertiary} style={{ marginLeft: 6 }} />
            <Text style={[styles.resetText, { color: Colors.textTertiary }]}>إعادة ضبط الوقت</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { backgroundColor: Colors.glass, borderColor: Colors.glassBorder }]}>
          <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
          <Text style={[styles.hint, { color: Colors.textSecondary }]}>
            {isActive ? "استمر في التركيز، الله يبارك في وقتك" : "اضغط ابدأ عندما تكون مستعداً للبدء"}
          </Text>
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    alignItems: 'center',
    padding: Spacing.xl,
    paddingTop: 80,
  },
  decorCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 150,
    opacity: 0.4,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing.xl,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.full,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing["4xl"],
  },
  title: {
    fontFamily: Typography.heading, fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontFamily: Typography.heading, fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  timerContainer: {
    marginBottom: Spacing.xl,
    alignItems: 'center',
  },
  circularContainer: {
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  trackRing: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: STROKE_WIDTH,
  },
  halfContainer: {
    position: 'absolute',
    width: 260,
    height: 260,
    flexDirection: 'row-reverse',
  },
  halfInner: {
    width: 130,
    height: 260,
  },
  progressHalf: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: STROKE_WIDTH,
    position: 'absolute',
    right: 0,
  },
  timerCircle: {
    width: 260 - STROKE_WIDTH * 2,
    height: 260 - STROKE_WIDTH * 2,
    borderRadius: (260 - STROKE_WIDTH * 2) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Shadow.lg,
  },
  timeText: {
    fontFamily: 'System', 
    fontSize: Typography["5xl"],
    fontWeight: '200',
    letterSpacing: -1,
  },
  remainingLabel: {
    fontFamily: Typography.body, fontSize: Typography.sm,
    marginTop: -5,
  },
  hifzControls: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.03)',
    padding: Spacing.lg,
    borderRadius: 24,
    marginBottom: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  hifzStack: {
    width: '100%',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  stackedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4,
  },
  hifzLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  hifzValueLarge: {
    fontSize: 22,
    fontWeight: 'bold',
    minWidth: 50,
    textAlign: 'center',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  largeMiniBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  surahName: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: Spacing.sm,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  btn: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  btnText: {
    fontFamily: Typography.heading, fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  resetText: {
    fontFamily: Typography.body, fontSize: Typography.sm,
  },
  footer: {
    marginTop: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    maxWidth: '90%',
  },
  hint: {
    fontFamily: Typography.body, fontSize: Typography.sm,
    textAlign: 'center',
  },
  setupCard: {
    width: '90%',
    backgroundColor: 'rgba(0,0,0,0.02)',
    padding: Spacing.md,
    borderRadius: 20,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  setupTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  setupRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  setupItem: {
    flex: 1,
  },
  setupLabel: {
    fontSize: 11,
    color: '#888',
    marginBottom: 4,
  },
  setupInput: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 16,
    fontWeight: '700',
    backgroundColor: 'rgba(255,255,255,0.5)',
  }
});
