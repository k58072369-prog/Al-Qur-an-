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
import { useAppStore } from "../store/AppStore";
import { Shadow, Spacing, Typography, useTheme } from "../theme";
import { MemorizationStrength } from "../types";
import { getXPProgressToNextLevel } from "../utils/helpers";

const { width } = Dimensions.get("window");
const CIRCLE_SIZE = width * 0.45;
const STROKE_WIDTH = 12;

const getStrengthColors = (
  Colors: any,
): Record<MemorizationStrength, string> => ({
  1: Colors.red,
  2: Colors.strength2,
  3: Colors.gold,
  4: Colors.strength4,
  5: Colors.primary,
});

// Circular Progress Component (Internalized for better style access)
// Professional Circular Progress Ring (Clipping Method)
const CircularProgress = ({
  percentage,
  color,
  size,
  Colors,
}: {
  percentage: number;
  color: string;
  size: number;
  Colors: any;
}) => {
  const pct = Math.max(0, Math.min(1, percentage));
  const innerSize = size - STROKE_WIDTH * 2;

  // Rotation logic: 0% is -180deg, 100% is 0deg for each half
  const getRotation = (p: number) => {
    return `${p * 180 - 180}deg`;
  };

  const rightHalfPct = pct <= 0.5 ? pct * 2 : 1;
  const leftHalfPct = pct > 0.5 ? (pct - 0.5) * 2 : 0;

  return (
    <View
      style={{
        width: size,
        height: size,
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      {/* Background Track Ring */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: STROKE_WIDTH,
          borderColor: Colors.border,
        }}
      />

      {/* Right Half Container */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          flexDirection: "row-reverse",
        }}
      >
        <View style={{ width: size / 2, height: size, overflow: "hidden" }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: STROKE_WIDTH,
              borderColor: "transparent",
              borderRightColor: color,
              borderTopColor: color,
              transform: [
                { rotate: "-45deg" },
                { rotate: getRotation(rightHalfPct) },
              ],
              position: "absolute",
              right: 0,
            }}
          />
        </View>
      </View>

      {/* Left Half Container */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          flexDirection: "row",
        }}
      >
        <View style={{ width: size / 2, height: size, overflow: "hidden" }}>
          <View
            style={{
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: STROKE_WIDTH,
              borderColor: "transparent",
              borderLeftColor: leftHalfPct > 0 ? color : "transparent",
              borderBottomColor: leftHalfPct > 0 ? color : "transparent",
              transform: [
                { rotate: "-45deg" },
                { rotate: getRotation(leftHalfPct) },
              ],
              position: "absolute",
              left: 0,
            }}
          />
        </View>
      </View>

      {/* Center Background & Text */}
      <View
        style={{
          width: innerSize + 2,
          height: innerSize + 2,
          borderRadius: (innerSize + 2) / 2,
          backgroundColor: Colors.surface,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <Text
          style={{
            fontFamily: Typography.heading,
            fontSize: 32,
            fontWeight: "bold",
            color: Colors.textPrimary,
          }}
        >
          {Math.round(pct * 100)}%
        </Text>
        <Text
          style={{
            fontFamily: Typography.body,
            fontSize: 12,
            color: Colors.textSecondary,
            marginTop: 2,
          }}
        >
          إتمام الحفظ
        </Text>
      </View>
    </View>
  );
};

export default function ProgressScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const STRENGTH_COLORS = React.useMemo(
    () => getStrengthColors(Colors),
    [Colors],
  );

  const { state, getMemorizedPages } = useAppStore();
  const { user, plan, streak } = state;
  const memorizedPages = getMemorizedPages();
  const xpProgress = getXPProgressToNextLevel(user?.totalXP ?? 0);
  const totalPages = plan ? plan.targetPages.length : 604;
  const planPct = totalPages > 0 ? memorizedPages.length / totalPages : 0;
  const totalXP = user?.totalXP ?? 0;

  const juzProgress = JUZ_META.map((juz) => {
    const pagesInJuz = Array.from(
      { length: juz.endPage - juz.startPage + 1 },
      (_, i) => juz.startPage + i,
    );
    const memorizedInJuz = pagesInJuz.filter((p) =>
      memorizedPages.some((mp) => mp.pageNumber === p),
    );
    const pct = memorizedInJuz.length / pagesInJuz.length;
    return { ...juz, pct };
  });

  const strengthDist: Record<MemorizationStrength, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };
  memorizedPages.forEach((p) => {
    strengthDist[p.strength as MemorizationStrength]++;
  });

  const remainingCount = totalPages - memorizedPages.length;
  const daysRemaining = Math.max(
    1,
    Math.ceil(remainingCount / (user?.dailyPages || 1)),
  );
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Modern Hero Section */}
        <View style={styles.heroCard}>
          <CircularProgress
            percentage={planPct}
            color={Colors.primary}
            size={CIRCLE_SIZE}
            Colors={Colors}
          />
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
              تاريخ الختم المتوقع:{" "}
              <Text style={{ fontWeight: "bold", color: Colors.gold }}>
                {finishDate.toLocaleDateString("ar-EG", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
            </Text>
          </View>
        </View>

        {/* Level Banner */}
        <View style={styles.levelCard}>
          <View style={styles.levelIconBox}>
            <Ionicons name="medal" size={24} color={Colors.primary} />
          </View>
          <View style={styles.levelInfo}>
            <Text style={styles.levelTitle}>
              {user?.name || "يا حامل القرآن"}
            </Text>
            <Text style={styles.levelSubtitle}>
              المستوى {Math.floor(totalXP / 1000) + 1} —{" "}
              {user?.title || "مبتدئ"}
            </Text>
            <View style={styles.xpTrack}>
              <View
                style={[
                  styles.xpFill,
                  { width: `${xpProgress.percentage * 100}%` },
                ]}
              />
            </View>
            <Text style={styles.xpStatus}>
              {xpProgress.current} / {xpProgress.required} XP للتالي
            </Text>
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

        <View style={styles.section}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>رحلة الختام (٣٠ جزء)</Text>
            <View style={{ backgroundColor: Colors.primaryMuted, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
               <Text style={{ fontSize: 13, color: Colors.primary, fontWeight: 'bold' }}>
                 {juzProgress.filter(j => j.pct >= 1).length} / ٣٠ جزء
               </Text>
            </View>
          </View>
          
          <View style={styles.roadmapContainer}>
            {juzProgress.map((j, index) => (
              <View key={j.id} style={styles.roadmapNode}>
                {/* Connection Line */}
                {index < juzProgress.length - 1 && (
                  <View 
                    style={[
                      styles.roadmapLine, 
                      { backgroundColor: j.pct >= 1 ? Colors.success : Colors.border }
                    ]} 
                  />
                )}
                
                {/* Milestone Node */}
                <View 
                  style={[
                    styles.milestoneIcon, 
                    j.pct >= 1 ? styles.milestoneDone : j.pct > 0 ? styles.milestoneActive : styles.milestoneEmpty
                  ]}
                >
                  <Text style={[styles.milestoneNum, { color: j.pct >= 1 ? '#FFF' : Colors.textPrimary }]}>{j.id}</Text>
                  {j.pct >= 1 && <Ionicons name="checkmark" size={12} color="#FFF" style={styles.nodeCheck} />}
                </View>

                {/* Progress Details */}
                <View style={styles.nodeContent}>
                  <Text style={styles.nodeTitle}>الجزء {j.id}</Text>
                  <View style={styles.nodeProgressTrack}>
                    <View style={[styles.nodeProgressFill, { width: `${j.pct * 100}%`, backgroundColor: j.pct >= 1 ? Colors.success : Colors.primary }]} />
                  </View>
                  <Text style={styles.nodeStat}>
                    {Math.round(j.pct * 100)}% متمم
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Strength Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ميزان الرسوخ (الجودة)</Text>
          <View style={styles.strengthScale}>
            {([5, 4, 3, 2, 1] as MemorizationStrength[]).map((s) => {
              const count = strengthDist[s];
              const pct =
                (memorizedPages.length > 0
                  ? count / memorizedPages.length
                  : 0) * 100;
              if (pct === 0) return null;
              return (
                <View
                  key={s}
                  style={[
                    styles.strengthChunk,
                    { width: `${pct}%`, backgroundColor: STRENGTH_COLORS[s] },
                  ]}
                />
              );
            })}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View
                style={[styles.dot, { backgroundColor: STRENGTH_COLORS[5] }]}
              />
              <Text style={styles.legendText}>راسخ</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.dot, { backgroundColor: STRENGTH_COLORS[3] }]}
              />
              <Text style={styles.legendText}>متوسط</Text>
            </View>
            <View style={styles.legendItem}>
              <View
                style={[styles.dot, { backgroundColor: STRENGTH_COLORS[1] }]}
              />
              <Text style={styles.legendText}>ضعيف</Text>
            </View>
          </View>
        </View>

        {/* Bottom Estimation Card */}
        <View style={styles.detailedCard}>
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>إجمالي الصفحات المتبقية</Text>
            <Text style={styles.detailValue}>{remainingCount} صفحة</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>أيام الإنجاز المتبقية</Text>
            <Text style={styles.detailValue}>{daysRemaining} يوم</Text>
          </View>
          <View style={styles.detailDivider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailTitle}>أطول سلسلة إنجاز</Text>
            <Text style={styles.detailValue}>{streak.longestStreak} يوم</Text>
          </View>
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

    heroCard: {
      backgroundColor: Colors.surface,
      borderRadius: 32,
      padding: Spacing.xl,
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: Colors.border,
      marginBottom: Spacing.xl,
    },
    heroMeta: {
      flexDirection: "row",
      width: "100%",
      justifyContent: "space-around",
      marginVertical: Spacing.lg,
    },
    metaItem: { alignItems: "center" },
    metaValue: { fontSize: 24, fontWeight: "bold", color: Colors.textPrimary },
    metaLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 4 },
    metaDivider: { width: 1, height: 30, backgroundColor: Colors.glassBorder },
    predictionBox: {
      backgroundColor: `${Colors.gold}10`,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
    },
    predictionText: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "left",
    },

    levelCard: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: Spacing.lg,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    levelIconBox: {
      width: 50,
      height: 50,
      borderRadius: 16,
      backgroundColor: `${Colors.primary}10`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    levelInfo: { flex: 1, alignItems: "flex-start" },
    levelTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "left",
      width: "100%",
    },
    levelSubtitle: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginBottom: 8,
      textAlign: "left",
      width: "100%",
    },
    xpTrack: {
      height: 6,
      width: "100%",
      backgroundColor: Colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    xpFill: { height: "100%", backgroundColor: Colors.primary },
    xpStatus: {
      fontSize: 10,
      color: Colors.textTertiary,
      marginTop: 4,
      textAlign: "left",
      width: "100%",
    },

    statsRow: {
      flexDirection: "row",
      gap: Spacing.md,
      marginBottom: Spacing.xl,
    },
    statMiniCard: {
      flex: 1,
      backgroundColor: Colors.surface,
      borderRadius: 20,
      padding: Spacing.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    statMiniValue: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginVertical: 4,
    },
    statMiniLabel: { fontSize: 9, color: Colors.textSecondary },

    section: { marginBottom: Spacing.lg },
    sectionTitle: {
      fontSize: 20,
      fontWeight: "900",
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
      textAlign: "left",
    },
    roadmapContainer: {
      paddingLeft: 10,
      marginTop: Spacing.md,
    },
    roadmapNode: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 30,
      position: 'relative',
    },
    roadmapLine: {
      position: 'absolute',
      left: 20,
      top: 40,
      width: 2,
      height: 30, // Connects to next node
      zIndex: 0,
    },
    milestoneIcon: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    milestoneDone: {
      backgroundColor: Colors.success,
      borderColor: Colors.success,
    },
    milestoneActive: {
      borderColor: Colors.primary,
      backgroundColor: Colors.surfaceElevated,
    },
    milestoneEmpty: {
      opacity: 0.8,
    },
    milestoneNum: {
      fontSize: 14,
      fontWeight: 'bold',
      includeFontPadding: false,
    },
    nodeCheck: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: Colors.success,
      borderRadius: 8,
      padding: 1,
      borderWidth: 1,
      borderColor: '#FFF',
    },
    nodeContent: {
      flex: 1,
      marginLeft: Spacing.lg,
      paddingTop: 4,
    },
    nodeTitle: {
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors.textPrimary,
      textAlign: 'left',
    },
    nodeProgressTrack: {
      height: 6,
      backgroundColor: Colors.border,
      borderRadius: 3,
      marginTop: 8,
      overflow: 'hidden',
    },
    nodeProgressFill: {
      height: '100%',
    },
    nodeStat: {
      fontSize: 11,
      color: Colors.textSecondary,
      marginTop: 4,
      textAlign: 'left',
    },

    strengthScale: {
      height: 12,
      width: "100%",
      backgroundColor: Colors.border,
      borderRadius: 6,
      flexDirection: "row",
      overflow: "hidden",
      marginBottom: Spacing.md,
    },
    strengthChunk: { height: "100%" },
    legend: { flexDirection: "row", justifyContent: "flex-start", gap: 20 },
    legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    legendText: { fontSize: 11, color: Colors.textSecondary },

    detailedCard: {
      backgroundColor: Colors.surface,
      borderRadius: 24,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    detailRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 12,
    },
    detailTitle: {
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "left",
    },
    detailValue: {
      fontSize: 14,
      fontWeight: "bold",
      color: Colors.textPrimary,
    },
  });
