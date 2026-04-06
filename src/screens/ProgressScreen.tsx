import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store/AppStore';
import { useTheme, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { MemorizationStrength } from '../types';
import {
  getDailyCompletionPercent,
  getXPProgressToNextLevel,
} from '../utils/helpers';
import { Ionicons } from '@expo/vector-icons';
import { JUZ_META, SURAHS } from '../data/quranMeta';

const { width } = Dimensions.get('window');

const getStrengthColors = (Colors: any): Record<MemorizationStrength, string> => ({
  1: Colors.red,
  2: Colors.strength2,
  3: Colors.gold,
  4: Colors.strength4,
  5: Colors.primary,
});

export default function ProgressScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const STRENGTH_COLORS = React.useMemo(() => getStrengthColors(Colors), [Colors]);

  const { state, getMemorizedPages, getPagesDue } = useAppStore();
  const { user, plan, dailyProgress, streak } = state;
  const memorizedPages = getMemorizedPages();
  const pagesDue = getPagesDue();

  const xpProgress = getXPProgressToNextLevel(user?.totalXP ?? 0);

  // Last 7 days completion
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toISOString().split('T')[0];
    const progress = dailyProgress.find((p) => p.date === dateStr);
    const pct = progress ? getDailyCompletionPercent(progress) : 0;
    const dayName = date.toLocaleDateString('ar-EG', { weekday: 'short' });
    return { date: dateStr, pct, dayName };
  });

  // Strength distribution
  const strengthDist: Record<MemorizationStrength, number> = {
    1: 0, 2: 0, 3: 0, 4: 0, 5: 0,
  };
  memorizedPages.forEach((p) => {
    strengthDist[p.strength as MemorizationStrength]++;
  });

  const totalPages = plan ? plan.targetPages.length : 604;
  const planPct = totalPages > 0 ? memorizedPages.length / totalPages : 0;

  const totalXP = user?.totalXP ?? 0;

  // Juz progress calculation
  const juzProgress = JUZ_META.map(juz => {
    const pagesInJuz = Array.from({ length: juz.endPage - juz.startPage + 1 }, (_, i) => juz.startPage + i);
    const memorizedInJuz = pagesInJuz.filter(p => memorizedPages.some(mp => mp.pageNumber === p));
    const pct = memorizedInJuz.length / pagesInJuz.length;
    return { ...juz, pct };
  });

  // Completion Estimation
  const pagesCount = memorizedPages.length;
  const targetPagesCount = plan?.targetPages.length || 604;
  const remainingCount = targetPagesCount - pagesCount;
  
  // Use dailyPages setting as the baseline for estimation
  const pagesPerDay = user?.dailyPages || 1;
  const daysRemaining = Math.max(1, Math.ceil(remainingCount / pagesPerDay));
  
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);
  
  // Surah progress calculation - only for surahs in the plan
  const planPages = new Set(plan?.targetPages || []);
  const surahsInPlan = SURAHS.filter(surah => {
    for (let p = surah.startPage; p <= surah.endPage; p++) {
      if (planPages.has(p)) return true;
    }
    return false;
  });

  const surahProgress = surahsInPlan.map(surah => {
    const pagesInSurahInPlan = Array.from(
      { length: surah.endPage - surah.startPage + 1 }, 
      (_, i) => surah.startPage + i
    ).filter(p => planPages.has(p));
    
    const memorizedInSurah = pagesInSurahInPlan.filter(p => memorizedPages.some(mp => mp.pageNumber === p));
    const pct = memorizedInSurah.length / pagesInSurahInPlan.length;
    return { ...surah, pct, totalInPlan: pagesInSurahInPlan.length, memorizedCount: memorizedInSurah.length };
  });

  // Fortress consistency
  const fortressStats = [
    { id: 'recitation', label: 'التلاوة', color: Colors.fortressRecitation, count: dailyProgress.filter(p => p.recitation).length },
    { id: 'listening', label: 'الاستماع', color: Colors.blue, count: dailyProgress.filter(p => p.listening).length },
    { id: 'preparation', label: 'التهيؤ', color: Colors.fortressPreparation, count: dailyProgress.filter(p => p.preparation).length },
    { id: 'memorization', label: 'الحفظ', color: Colors.fortressMemorization, count: dailyProgress.filter(p => p.memorization).length },
    { id: 'review', label: 'المراجعة', color: Colors.fortressReview, count: dailyProgress.filter(p => p.shortReview || p.longReview).length },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>تحليلات متقدمة</Text>
        <Text style={styles.headerSubtitle}>رؤية شاملة لرحلة الحفظ</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Level & XP */}
        <View style={styles.levelCard}>
          <LinearGradient
            colors={[`${Colors.primary}12`, `${Colors.primary}04`]}
            style={styles.levelGradient}
          >
            <View style={styles.levelLeft}>
              <Ionicons name="medal-outline" size={32} color={Colors.gold} />
            </View>
            <View style={styles.levelInfo}>
              <Text style={styles.levelTitle}>{user?.title ?? 'مبتدئ'}</Text>
              <Text style={styles.levelSubtitle}>المستوى {Math.floor(totalXP / 1000) + 1}</Text>
              <View style={styles.xpBar}>
                <View style={styles.xpBarBg}>
                  <View
                    style={[
                      styles.xpBarFill,
                      { width: `${xpProgress.percentage * 100}%` },
                    ]}
                  />
                </View>
                <Text style={styles.xpText}>{xpProgress.current} / {xpProgress.required} XP للترقية</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'الختم المتوقع', value: finishDate.toLocaleDateString('ar-EG', { month: 'long', year: 'numeric' }), sub: `${daysRemaining} يوم متبقي`, icon: 'calendar', color: Colors.primary },
            { label: 'التقدم الحالي', value: `${Math.round(planPct * 100)}%`, sub: `${memorizedPages.length} من ${targetPagesCount} صفحة`, icon: 'analytics', color: Colors.success },
            { label: 'السلسلة', value: `${streak.currentStreak} يوم`, sub: `الأطول: ${streak.longestStreak}`, icon: 'flame', color: Colors.gold },
            { label: 'إجمالي النقاط', value: `${user?.totalXP ?? 0}`, sub: `اللقب: ${user?.title}`, icon: 'star', color: Colors.purple },
          ].map((item, i) => (
            <View key={i} style={styles.gridCard}>
              <View style={[styles.gridIcon, { backgroundColor: `${item.color}15` }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={styles.gridInfo}>
                <Text style={styles.gridLabel}>{item.label}</Text>
                <Text style={[styles.gridValue, { color: Colors.textPrimary }]}>{item.value}</Text>
                <Text style={styles.gridSub}>{item.sub}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Advanced Progress Chart (Placeholder-like bar) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>مؤشرات الإنجاز</Text>
          <View style={styles.advancedCard}>
            <View style={styles.advancedHeader}>
              <View>
                <Text style={styles.advancedTitle}>نسبة الإتمام الكلية</Text>
                <Text style={styles.advancedSub}>{Math.round(planPct * 100)}% من الورق الكلي</Text>
              </View>
              <Text style={styles.advancedBigPct}>{Math.round(planPct * 100)}%</Text>
            </View>
            <View style={styles.bigBarBg}>
              <View style={[styles.bigBarFill, { width: `${planPct * 100}%` }]} />
            </View>
            <View style={styles.advancedMetaRow}>
              <View style={styles.metaItem}>
                <View style={[styles.metaDot, { backgroundColor: Colors.primary }]} />
                <Text style={styles.metaText}>محفوظ: {memorizedPages.length}</Text>
              </View>
              <View style={styles.metaItem}>
                <View style={[styles.metaDot, { backgroundColor: Colors.border }]} />
                <Text style={styles.metaText}>متبقي: {remainingCount}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Juz completion Map */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>خريطة الأجزاء الثلاثين</Text>
              <Text style={styles.sectionSubtitle}>تتبع تقدمك في كل جزء على حدة</Text>
            </View>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{juzProgress.filter(j => j.pct >= 1).length} مكتمل</Text>
            </View>
          </View>

          <View style={styles.juzGrid}>
            {juzProgress.map((j) => {
              const info = j;
              const isCompleted = info.pct >= 1;
              const isStarted = info.pct > 0;
              
              return (
                <View key={info.id} style={styles.juzCardWrapper}>
                  <View 
                    style={[
                      styles.juzCard, 
                      { 
                        backgroundColor: isCompleted ? Colors.success : Colors.surface,
                        borderColor: isCompleted ? Colors.success : isStarted ? Colors.primary : Colors.borderLight,
                        ...Shadow.sm,
                      }
                    ]}
                  >
                    {/* Progress Fill Background for partially started Juz */}
                    {isStarted && !isCompleted && (
                      <View style={[styles.juzCardProgress, { height: `${info.pct * 100}%`, backgroundColor: `${Colors.primary}15` }]} />
                    )}

                    <Text style={[
                      styles.juzCardNumber, 
                      { color: isCompleted ? '#FFF' : isStarted ? Colors.primary : Colors.textTertiary }
                    ]}>
                      {info.id}
                    </Text>

                    {isCompleted ? (
                      <View style={styles.completedIconBox}>
                        <Ionicons name="checkmark-sharp" size={10} color="#FFF" />
                      </View>
                    ) : isStarted ? (
                      <Text style={[styles.juzPctSmall, { color: Colors.primary }]}>{Math.round(info.pct * 100)}%</Text>
                    ) : null}
                  </View>
                  <Text style={[styles.juzCardLabel, { color: isStarted ? Colors.textSecondary : Colors.textMuted }]}>
                    جزء {info.id}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Surah Progress List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>تقدم السور الحالية</Text>
          <View style={styles.surahCard}>
            {surahProgress.length > 0 ? surahProgress.map((surah) => (
              <View key={surah.id} style={styles.surahRow}>
                <View style={styles.surahHeader}>
                  <Text style={styles.surahName}>{surah.nameAr}</Text>
                  <Text style={styles.surahPctText}>
                    {surah.memorizedCount} / {surah.totalInPlan} صفحة
                  </Text>
                </View>
                <View style={styles.surahBarBg}>
                  <View 
                    style={[
                      styles.surahBarFill, 
                      { 
                        width: `${surah.pct * 100}%`, 
                        backgroundColor: surah.pct === 1 ? Colors.success : Colors.primary 
                      }
                    ]} 
                  />
                </View>
              </View>
            )) : (
              <Text style={styles.emptyText}>لا توجد سور في الخطة الحالية</Text>
            )}
          </View>
        </View>

        {/* Fortress Performance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>أداء الأقسام اليومية</Text>
          <View style={styles.fortressStatsRow}>
            {fortressStats.map((fs) => (
              <View key={fs.id} style={styles.fortressStatCard}>
                <View style={[styles.fortressStatIcon, { backgroundColor: `${fs.color}15` }]}>
                  <Text style={[styles.fortressStatCount, { color: fs.color }]}>{fs.count}</Text>
                </View>
                <Text style={styles.fortressStatLabel}>{fs.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Strength Balance */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ميزان القوة</Text>
          <View style={styles.strengthCard}>
            {([5, 4, 3, 2, 1] as MemorizationStrength[]).map((s) => {
              const count = strengthDist[s];
              const pct = memorizedPages.length > 0 ? count / memorizedPages.length : 0;
              const labels: Record<MemorizationStrength, string> = {
                1: 'تحتاج إعادة', 2: 'غير مستقرة', 3: 'متوسطة', 4: 'قوية', 5: 'راسخة'
              };
              return (
                <View key={s} style={styles.strengthRow}>
                  <Text style={styles.strengthLabel}>{labels[s]}</Text>
                  <View style={styles.strengthBarBg}>
                    <View style={[styles.strengthBarFill, { width: `${pct * 100}%`, backgroundColor: STRENGTH_COLORS[s] }]} />
                  </View>
                  <Text style={styles.strengthValueText}>{count}</Text>
                </View>
              );
            })}
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
  headerTitle: { fontFamily: Typography.heading, fontSize: Typography.xl, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'left' },
  headerSubtitle: { fontFamily: Typography.body, fontSize: Typography.sm, color: Colors.textTertiary, textAlign: 'left', marginTop: 3 },
  scroll: { padding: Spacing.base, gap: Spacing.lg },

  levelCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: `${Colors.primary}15` },
  levelGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.lg, gap: Spacing.base },
  levelLeft: { backgroundColor: `${Colors.primary}0A`, width: 54, height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: `${Colors.primary}10` },
  levelInfo: { flex: 1, alignItems: 'flex-start', gap: 4 },
  levelTitle: { fontFamily: Typography.heading, fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.primary },
  levelSubtitle: { fontFamily: Typography.body, fontSize: Typography.sm, color: Colors.textSecondary },
  xpBar: { width: '100%', gap: 4, marginTop: 4 },
  xpBarBg: { height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  xpBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  xpText: { fontFamily: Typography.body, fontSize: 10, color: Colors.textTertiary },

  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  gridCard: { width: '100%', backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.lg, borderWidth: 1, borderColor: Colors.glassBorder },
  gridIcon: { width: 50, height: 50, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  gridInfo: { flex: 1, alignItems: 'flex-start' },
  gridValue: { fontFamily: Typography.heading, fontSize: Typography.lg, fontWeight: Typography.bold, marginTop: 2 },
  gridLabel: { fontFamily: Typography.heading, fontSize: 13, color: Colors.textSecondary, fontWeight: Typography.semibold },
  gridSub: { fontFamily: Typography.body, fontSize: 11, color: Colors.textTertiary, marginTop: 2 },

  section: { gap: Spacing.md },
  sectionTitle: { fontFamily: Typography.heading, fontSize: Typography.base, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'left', paddingHorizontal: 4 },
  sectionSubtitle: { fontFamily: Typography.body, fontSize: 11, color: Colors.textTertiary, textAlign: 'left', marginTop: 2, paddingHorizontal: 4 },

  advancedCard: { backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.glassBorder, gap: Spacing.md },
  advancedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  advancedTitle: { fontFamily: Typography.heading, fontSize: Typography.base, fontWeight: Typography.semibold, color: Colors.textPrimary },
  advancedSub: { fontFamily: Typography.body, fontSize: Typography.xs, color: Colors.textSecondary },
  advancedBigPct: { fontSize: Typography['2xl'], fontWeight: Typography.bold, color: Colors.primary },
  bigBarBg: { height: 10, backgroundColor: Colors.borderLight, borderRadius: 5, overflow: 'hidden' },
  bigBarFill: { height: 10, backgroundColor: Colors.primary, borderRadius: 5 },
  advancedMetaRow: { flexDirection: 'row', gap: Spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaDot: { width: 8, height: 8, borderRadius: 4 },
  metaText: { fontFamily: Typography.body, fontSize: 11, color: Colors.textSecondary },
  
  juzGrid: { 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    gap: 12, 
    justifyContent: 'flex-start',
    paddingVertical: Spacing.md,
  },
  juzCardWrapper: {
    width: (width - Spacing.base * 2 - 48) / 5,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  juzCard: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  juzCardProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  juzCardNumber: {
    fontFamily: Typography.body, fontSize: Typography.base,
    fontWeight: '800',
    zIndex: 10,
  },
  juzPctSmall: {
    fontFamily: Typography.heading, fontSize: 8,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 4,
    zIndex: 10,
  },
  juzCardLabel: {
    fontFamily: Typography.heading, fontSize: 9,
    marginTop: 6,
    fontWeight: '600',
  },
  completedIconBox: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFF',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.success,
  },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 4 },
  sectionBadge: { backgroundColor: `${Colors.primary}10`, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  sectionBadgeText: { fontFamily: Typography.heading, fontSize: 11, color: Colors.primary, fontWeight: 'bold' },
  
  emptyText: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: 20 },

  surahCard: { backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.glassBorder, gap: Spacing.md },
  surahRow: { gap: 6 },
  surahHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  surahName: { fontFamily: Typography.body, fontSize: Typography.sm, fontWeight: Typography.medium, color: Colors.textPrimary },
  surahPctText: { fontFamily: Typography.heading, fontSize: Typography.xs, color: Colors.primary, fontWeight: Typography.bold },
  surahBarBg: { height: 4, backgroundColor: Colors.borderLight, borderRadius: 2, overflow: 'hidden' },
  surahBarFill: { height: 4, borderRadius: 2 },

  fortressStatsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  fortressStatCard: { flex: 1, minWidth: '30%', backgroundColor: Colors.glass, borderRadius: BorderRadius.lg, padding: Spacing.md, alignItems: 'center', gap: Spacing.xs, borderWidth: 1, borderColor: Colors.glassBorder },
  fortressStatIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  fortressStatCount: { fontFamily: Typography.heading, fontSize: Typography.md, fontWeight: Typography.bold },
  fortressStatLabel: { fontFamily: Typography.body, fontSize: 10, color: Colors.textSecondary },

  strengthCard: { backgroundColor: Colors.glass, borderRadius: BorderRadius.xl, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.glassBorder, gap: Spacing.sm },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.base },
  strengthLabel: { width: 64, fontFamily: Typography.body, fontSize: 10, color: Colors.textSecondary, textAlign: 'left' },
  strengthBarBg: { flex: 1, height: 6, backgroundColor: Colors.borderLight, borderRadius: 3, overflow: 'hidden' },
  strengthBarFill: { height: 6, borderRadius: 3 },
  strengthValueText: { width: 20, fontFamily: Typography.heading, fontSize: 11, fontWeight: Typography.bold, color: Colors.textPrimary, textAlign: 'center' },
});
