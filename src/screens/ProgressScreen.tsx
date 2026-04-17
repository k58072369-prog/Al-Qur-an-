import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { JUZ_META } from "../data/quranMeta";
import { CircularProgress } from "../components/progress/CircularProgress";
import { JuzRoadmap } from "../components/progress/JuzRoadmap";
import { useAppStore } from "../store/AppStore";
import { Shadow, Spacing, Typography, useTheme } from "../theme";
import { MemorizationStrength } from "../types";
import { getXPProgressToNextLevel } from "../utils/helpers";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.45;

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

  const { state, getMemorizedPages } = useAppStore();
  const { user, plan, streak } = state;
  const memorizedPages = getMemorizedPages();
  const xpProgress = getXPProgressToNextLevel(user?.totalXP ?? 0);
  const totalPages = plan ? plan.targetPages.length : 604;
  const planPct = totalPages > 0 ? memorizedPages.length / totalPages : 0;
  const totalXP = user?.totalXP ?? 0;

  const juzProgress = JUZ_META.map((juz) => {
    const pagesInJuz = Array.from({ length: juz.endPage - juz.startPage + 1 }, (_, i) => juz.startPage + i);
    const memorizedInJuz = pagesInJuz.filter((p) => memorizedPages.some((mp) => mp.pageNumber === p));
    const pct = memorizedInJuz.length / pagesInJuz.length;
    return { id: juz.id, pct };
  });

  const strengthDist: Record<MemorizationStrength, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  memorizedPages.forEach((p) => { strengthDist[p.strength as MemorizationStrength]++; });

  const remainingCount = totalPages - memorizedPages.length;
  const daysRemaining = Math.max(1, Math.ceil(remainingCount / (user?.dailyPages || 1)));
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        
        {/* Hero Section */}
        <View style={styles.heroCard}>
          <CircularProgress percentage={planPct} color={Colors.primary} size={CIRCLE_SIZE} Colors={Colors} />
          <View style={styles.heroMeta}>
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{memorizedPages.length}</Text>
              <Text style={styles.metaLabel}>صفحة متممة</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Text style={styles.metaValue}>{remainingCount}</Text>
              <Text style={styles.metaLabel}>صفحة متبقية</Text>
            </View>
          </View>
          <View style={styles.predictionBox}>
            <Text style={styles.predictionText}>
              تاريخ الختم المتوقع: <Text style={{ fontWeight: "bold", color: Colors.gold }}>{finishDate.toLocaleDateString("ar-EG", { month: "long", year: "numeric" })}</Text>
            </Text>
          </View>
        </View>

        {/* Level Banner */}
        <View style={styles.levelCard}>
          <View style={styles.levelIconBox}><Ionicons name="medal" size={24} color={Colors.primary} /></View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>{user?.name || "يا حامل القرآن"}</Text>
            <Text style={styles.levelSubtitle}>المستوى {Math.floor(totalXP / 1000) + 1} — {user?.title || "مبتدئ"}</Text>
            <View style={styles.xpTrack}><View style={[styles.xpFill, { width: `${xpProgress.percentage * 100}%` }]} /></View>
            <Text style={styles.xpStatus}>{xpProgress.current} / {xpProgress.required} XP للتالي</Text>
          </View>
        </View>

        {/* Detailed Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statMiniCard}>
            <Ionicons name="flame" size={18} color={Colors.gold} />
            <Text style={styles.statMiniValue}>{streak.currentStreak}</Text>
            <Text style={styles.statMiniLabel}>يوم متواصل</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Ionicons name="analytics" size={18} color={Colors.blue} />
            <Text style={styles.statMiniValue}>{user?.dailyPages || 1}</Text>
            <Text style={styles.statMiniLabel}>صفحة/يوم</Text>
          </View>
          <View style={styles.statMiniCard}>
            <Ionicons name="trophy" size={18} color={Colors.success} />
            <Text style={styles.statMiniValue}>{totalXP}</Text>
            <Text style={styles.statMiniLabel}>نقاط الخبرة</Text>
          </View>
        </View>

        {/* Roadmap */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>رحلة الختام (٣٠ جزء)</Text>
            <View style={styles.badge}><Text style={styles.badgeText}>{juzProgress.filter(j => j.pct >= 1).length} / ٣٠ جزء</Text></View>
          </View>
          <JuzRoadmap juzProgress={juzProgress} Colors={Colors} />
        </View>

        {/* Strength Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ميزان الرسوخ (الجودة)</Text>
          <View style={styles.strengthScale}>
            {([5, 4, 3, 2, 1] as MemorizationStrength[]).map((s) => {
              const count = strengthDist[s];
              const pct = (memorizedPages.length > 0 ? count / memorizedPages.length : 0) * 100;
              if (pct === 0) return null;
              return <View key={s} style={[styles.strengthChunk, { width: `${pct}%`, backgroundColor: STRENGTH_COLORS[s] }]} />;
            })}
          </View>
          <View style={styles.legend}>
            {[[5, "راسخ"], [3, "متوسط"], [1, "ضعيف"]].map(([s, label]) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: STRENGTH_COLORS[s as MemorizationStrength] }]} />
                <Text style={styles.legendText}>{label as string}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom Metrics */}
        <View style={styles.detailedCard}>
          {[
            { label: "إجمالي الصفحات المتبقية", value: `${remainingCount} صفحة` },
            { label: "أيام الإنجاز المتبقية", value: `${daysRemaining} يوم` },
            { label: "أطول سلسلة إنجاز", value: `${streak.longestStreak} يوم` },
          ].map((item, i) => (
            <View key={i}>
              <View style={styles.detailRow}><Text style={styles.detailTitle}>{item.label}</Text><Text style={styles.detailValue}>{item.value}</Text></View>
              {i < 2 && <View style={styles.detailDivider} />}
            </View>
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scroll: { padding: Spacing.xl, paddingTop: 50 },
    heroCard: { backgroundColor: Colors.primaryMuted, borderRadius: 32, padding: Spacing.xl, alignItems: "center", borderWidth: 1.5, borderColor: `${Colors.primary}30`, marginBottom: Spacing.xl },
    heroMeta: { flexDirection: "row", width: "100%", justifyContent: "space-around", marginVertical: Spacing.lg },
    metaItem: { alignItems: "center" },
    metaValue: { fontSize: 24, fontWeight: "bold", color: Colors.textPrimary },
    metaLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
    metaDivider: { width: 1, height: 30, backgroundColor: Colors.glassBorder },
    predictionBox: { backgroundColor: `${Colors.gold}10`, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12 },
    predictionText: { fontSize: 13, color: Colors.textSecondary, textAlign: "left" },
    levelCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: Spacing.lg, flexDirection: "row", alignItems: "center", marginBottom: Spacing.xl, borderWidth: 1, borderColor: Colors.border },
    levelIconBox: { width: 50, height: 50, borderRadius: 16, backgroundColor: `${Colors.primary}10`, alignItems: "center", justifyContent: "center", marginRight: Spacing.md },
    levelInfo: { flex: 1, alignItems: "flex-start" },
    levelTitle: { fontSize: 18, fontWeight: "bold", color: Colors.textPrimary, textAlign: "left", width: "100%" },
    levelSubtitle: { fontSize: 12, color: Colors.textSecondary, marginBottom: 8, textAlign: "left", width: "100%" },
    xpTrack: { height: 6, width: "100%", backgroundColor: Colors.border, borderRadius: 3, overflow: "hidden" },
    xpFill: { height: "100%", backgroundColor: Colors.primary },
    xpStatus: { fontSize: 10, color: Colors.textTertiary, marginTop: 4, textAlign: "left", width: "100%" },
    statsRow: { flexDirection: "row", gap: Spacing.md, marginBottom: Spacing.xl },
    statMiniCard: { flex: 1, backgroundColor: Colors.surface, borderRadius: 20, padding: Spacing.md, alignItems: "center", borderWidth: 1, borderColor: Colors.border },
    statMiniValue: { fontSize: 16, fontWeight: "bold", color: Colors.textPrimary, marginVertical: 4 },
    statMiniLabel: { fontSize: 9, color: Colors.textSecondary },
    section: { marginBottom: Spacing.lg },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
    sectionTitle: { fontSize: 20, fontWeight: "900", color: Colors.textPrimary, textAlign: "left" },
    badge: { backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
    badgeText: { fontSize: 13, color: Colors.primary, fontWeight: 'bold' },
    strengthScale: { height: 12, width: "100%", backgroundColor: Colors.border, borderRadius: 6, flexDirection: "row", overflow: "hidden", marginBottom: Spacing.md },
    strengthChunk: { height: "100%" },
    legend: { flexDirection: "row", justifyContent: "flex-start", gap: 20 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: Colors.textSecondary },
    detailedCard: { backgroundColor: Colors.surface, borderRadius: 24, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border },
    detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12 },
    detailTitle: { fontSize: 13, color: Colors.textSecondary, textAlign: "left" },
    detailValue: { fontSize: 14, fontWeight: "bold", color: Colors.textPrimary },
    detailDivider: { height: 1, backgroundColor: Colors.border, opacity: 0.5 },
  });
