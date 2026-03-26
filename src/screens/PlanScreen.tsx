import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { SURAHS } from "../data/quranMeta";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";
import { toArabicNumerals } from "../utils/helpers";

const { width, height } = Dimensions.get("window");

// ============================================================
// Types & Constants
// ============================================================

type DayTask = {
  id: string;
  label: string;
  icon: any;
  color: string;
};

type DayItem = {
  dayIndex: number;
  pages: { start: number; end: number };
  pageNumbers: number[];
  surahLabel: string;
  isCurrent: boolean;
  isCompleted: boolean;
  completionPct: number;
  tasks: DayTask[];
};

const MOTIVATIONAL_MESSAGES = [
  {
    title: "مبارك الإنجاز!",
    subtitle: "لقد أتممت وردك اليومي بنجاح",
    dua: "«يقال لصاحب القرآن اقرأ وارتقِ ورتل كما كنت ترتل في الدنيا»",
  },
  {
    title: "هنيئاً لك الرفعة!",
    subtitle: "خطوة مباركة نحو الختم العظيم",
    dua: "«خيركم من تعلم القرآن وعلمه»",
  },
  {
    title: "رباط مع الله!",
    subtitle: "نورت يومك بكلام الله المشرق",
    dua: "«أهل القرآن هم أهل الله وخاصته»",
  },
  {
    title: "توفيق من الله!",
    subtitle: "الثبات على الورد هو سر النجاح",
    dua: "«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعًا لأصحابه»",
  },
  {
    title: "إنجاز عظيم!",
    subtitle: "يوم جديد، صفحة جديدة من الفلاح",
    dua: "«لا يحزن من كان القرآن في صدره»",
  },
];

// ============================================================
// Styles
// ============================================================

const styles_global = StyleSheet.create({
  celebrationOverlay: {
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  celebrationContent: {
    alignItems: "center",
    gap: Spacing.xl,
    paddingHorizontal: 30,
    width: '100%',
  },
  trophyContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  glow: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 40,
  },
  trophyIcon: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  textContent: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  celebrationTitle: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#FFF",
    textAlign: "center",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  celebrationSubtitle: {
    fontSize: 22,
    color: "#F0FDF4",
    textAlign: "center",
    opacity: 0.9,
    marginBottom: Spacing.sm,
  },
  duaBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
  },
  celebrationDua: {
    fontSize: 17,
    color: "#DCFCE7",
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 26,
    fontWeight: '500',
  },
  closeCelebration: {
    backgroundColor: '#FFF',
    paddingHorizontal: Spacing.xl * 1.5,
    paddingVertical: Spacing.md,
    borderRadius: 30,
    marginTop: Spacing.xl,
    ...Shadow.md,
  },
  closeCelebrationText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: 'bold',
  },
  particlesContainer: {
    position: "absolute",
    width: width,
    height: height,
    top: 0,
    pointerEvents: 'none',
  },
  particle: {
    position: "absolute",
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.md,
    },
    emptyText: { color: Colors.textSecondary, fontSize: 16 },

    headerContainer: {
      paddingTop: 80,
      paddingBottom: 30,
      paddingHorizontal: Spacing.xl,
      alignItems: "flex-start",
    },
    headerTextSection: {
      marginBottom: Spacing.xl,
      width: "100%",
      alignItems: "flex-start",
    },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "left",
    },
    headerSubtitle: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "left",
      marginTop: 4,
    },

    progressSection: { marginBottom: Spacing.xl, width: "100%" },
    progressTextRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 8,
    },
    progressTitle: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: "500",
      textAlign: "left",
    },
    progressPercent: {
      fontSize: 13,
      color: Colors.primary,
      fontWeight: "bold",
    },
    mainProgressBarBg: {
      height: 6,
      backgroundColor: Colors.border,
      borderRadius: 3,
      overflow: "hidden",
    },
    mainProgressBarFill: { height: "100%", borderRadius: 3 },

    statsRow: { flexDirection: "row", gap: Spacing.md, width: "100%" },
    statCard: {
      flex: 1,
      backgroundColor: `${Colors.primary}08`,
      borderRadius: 20,
      padding: Spacing.md,
      alignItems: "center",
      borderWidth: 1,
      borderColor: `${Colors.primary}15`,
    },
    statVal: { fontSize: 20, fontWeight: "bold", color: Colors.primary },
    statLabel: { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

    listContent: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

    listRow: {
      flexDirection: "row",
      marginBottom: 0,
      justifyContent: "flex-start",
    },

    roadmapPathColumn: { width: 40, alignItems: "center" },
    pathNode: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      marginTop: 18,
    },
    pathNodeInner: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: Colors.borderLight,
    },
    pathLine: {
      width: 2,
      flex: 1,
      backgroundColor: Colors.borderLight,
      marginVertical: 4,
    },

    dayContainer: {
      flex: 1,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      marginBottom: 20,
      ...Shadow.sm,
      marginRight: Spacing.md,
    },
    dayTouchable: { padding: Spacing.lg },

    dayMainRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    dayInfo: { flex: 1, alignItems: "flex-start", gap: 4 },
    dayLabelRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    dayLabel: {
      fontSize: 17,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "left",
    },
    dayTask: { fontSize: 12, color: Colors.textTertiary, textAlign: "left" },

    currentBadge: {
      backgroundColor: Colors.primary,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      ...Shadow.emerald,
    },
    currentBadgeText: { fontSize: 9, color: "#FFF", fontWeight: "bold" },

    dayDetails: { marginTop: Spacing.lg, gap: Spacing.md },
    detailsTitle: {
      fontSize: 12,
      fontWeight: "bold",
      color: Colors.textSecondary,
      textAlign: "left",
    },
    divider: {
      height: 1,
      backgroundColor: Colors.borderLight,
      width: "100%",
      marginBottom: 4,
    },

    detailGrid: { gap: 12 },
    detailItem: { flexDirection: "row", alignItems: "center", gap: 10 },
    detailIconBox: {
      width: 30,
      height: 30,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
    },
    detailText: {
      flex: 1,
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "left",
      lineHeight: 16,
    },

    completeBtn: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      marginTop: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.emerald,
    },
    completeBtnText: {
      color: "#FFF",
      fontSize: Typography.base,
      fontWeight: Typography.bold,
    },

    progressBarBg: {
      height: 4,
      backgroundColor: Colors.borderLight,
      overflow: "hidden",
      borderBottomLeftRadius: 10,
      borderBottomRightRadius: 10,
    },
    progressBarFill: { height: "100%" },
  });

// ============================================================
// Sub-Components
// ============================================================

const Particle = () => {
  const tx = useSharedValue(Math.random() * width - width / 2);
  const ty = useSharedValue(height / 2 + 100);
  const scale = useSharedValue(Math.random() * 0.8 + 0.2);
  const rotation = useSharedValue(0);
  const color = ["#FFD700", "#FFF", "#4ADE80", "#60A5FA", "#F87171"][Math.floor(Math.random() * 5)];
  
  useEffect(() => {
    ty.value = withTiming(-height / 2 - 200, { 
      duration: 3000 + Math.random() * 2000, 
      easing: Easing.out(Easing.quad) 
    });
    rotation.value = withTiming(360 * 2, { duration: 4000 });
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value }, 
      { translateY: ty.value }, 
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
    opacity: withTiming(0, { duration: 4500 }),
    backgroundColor: color,
  }));

  return <Animated.View style={[styles_global.particle, style]} />;
};

const CelebrationOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const [msg] = useState(() => MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)]);
  
  useEffect(() => {
    const timer = setTimeout(onComplete, 6000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <Animated.View 
      entering={FadeIn.duration(600)} 
      exiting={FadeOut.duration(500)}
      style={[StyleSheet.absoluteFill, styles_global.celebrationOverlay]}
    >
      <LinearGradient
        colors={["rgba(6, 78, 59, 1)", "rgba(16, 185, 129, 0.95)", "rgba(5, 150, 105, 0.98)"]}
        style={StyleSheet.absoluteFill}
      />
      
      <View style={styles_global.celebrationContent}>
        <Animated.View 
          entering={FadeIn.delay(400).duration(800)}
          style={styles_global.trophyContainer}
        >
          <View style={styles_global.glow} />
          <Ionicons name="trophy" size={130} color="#FFD700" style={styles_global.trophyIcon} />
        </Animated.View>
        
        <Animated.View entering={FadeIn.delay(800)} style={styles_global.textContent}>
          <Text style={styles_global.celebrationTitle}>{msg.title}</Text>
          <Text style={styles_global.celebrationSubtitle}>{msg.subtitle}</Text>
          
          <View style={styles_global.duaBox}>
            <Ionicons name="sparkles" size={18} color="#FFD700" style={{ marginBottom: 4 }} />
            <Text style={styles_global.celebrationDua}>{msg.dua}</Text>
            <Ionicons name="sparkles" size={18} color="#FFD700" style={{ marginTop: 4, alignSelf: 'flex-end' }} />
          </View>
        </Animated.View>

        <TouchableOpacity onPress={onComplete} style={styles_global.closeCelebration}>
          <Text style={styles_global.closeCelebrationText}>استمرار</Text>
        </TouchableOpacity>
        
        <View style={styles_global.particlesContainer}>
          {[...Array(40)].map((_, i) => (
            <Particle key={i} />
          ))}
        </View>
      </View>
    </Animated.View>
  );
};

const DetailItem = ({ icon, label, color, styles }: any) => (
  <View style={styles.detailItem}>
    <View style={[styles.detailIconBox, { backgroundColor: `${color}15` }]}>
      <Ionicons name={icon} size={13} color={color} />
    </View>
    <Text style={styles.detailText} numberOfLines={2}>
      {label}
    </Text>
  </View>
);

const PlanDay = React.memo(
  ({
    item,
    expanded,
    onToggle,
    onComplete,
    Colors,
    styles,
    isLast,
  }: {
    item: DayItem;
    expanded: boolean;
    onToggle: (day: number) => void;
    onComplete: (item: DayItem) => void;
    Colors: any;
    styles: any;
    isLast: boolean;
  }) => {
    return (
      <View style={styles.listRow}>
        <View style={styles.roadmapPathColumn}>
          <View
            style={[
              styles.pathNode,
              item.isCompleted && {
                backgroundColor: Colors.success,
                borderColor: Colors.success,
              },
              item.isCurrent && { borderColor: Colors.primary, borderWidth: 2 },
            ]}
          >
            {item.isCompleted ? (
              <Ionicons name="checkmark" size={14} color="#FFF" />
            ) : (
              <View
                style={[
                  styles.pathNodeInner,
                  item.isCurrent && { backgroundColor: Colors.primary },
                ]}
              />
            )}
          </View>
          {!isLast && (
            <View
              style={[
                styles.pathLine,
                item.isCompleted && { backgroundColor: Colors.success },
              ]}
            />
          )}
        </View>

        <Animated.View style={styles.dayContainer}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => onToggle(item.dayIndex)}
            style={styles.dayTouchable}
          >
            <View style={styles.dayMainRow}>
              <View style={styles.dayInfo}>
                <View style={styles.dayLabelRow}>
                  <Text style={styles.dayLabel}>
                    اليوم {toArabicNumerals(item.dayIndex)}
                  </Text>
                  {item.isCurrent && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>محطتك التالية</Text>
                    </View>
                  )}
                  {item.isCompleted && (
                    <View style={[styles.currentBadge, { backgroundColor: Colors.success }]}>
                      <Text style={styles.currentBadgeText}>تم الإنجاز</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.dayTask} numberOfLines={1}>
                  {item.surahLabel} • صفحات:{" "}
                  {toArabicNumerals(item.pages.start)}-
                  {toArabicNumerals(item.pages.end)}
                </Text>
              </View>

              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={18}
                color={expanded ? Colors.primary : Colors.textTertiary}
              />
            </View>

            {expanded && (
              <Animated.View
                entering={FadeIn.duration(300)}
                style={styles.dayDetails}
              >
                <View style={styles.divider} />
                <Text style={styles.detailsTitle}>مهام هذا اليوم:</Text>
                <View style={styles.detailGrid}>
                  {item.tasks.map((task) => (
                    <DetailItem
                      key={task.id}
                      icon={task.icon}
                      label={task.label}
                      color={task.color}
                      styles={styles}
                    />
                  ))}
                </View>

                {item.isCurrent && !item.isCompleted && (
                  <TouchableOpacity 
                    style={styles.completeBtn}
                    onPress={() => onComplete(item)}
                  >
                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                    <Text style={styles.completeBtnText}>إتمام كافة مهام اليوم</Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </TouchableOpacity>

          {!item.isCompleted && item.completionPct > 0 && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${item.completionPct}%`,
                    backgroundColor: Colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </Animated.View>
      </View>
    );
  },
);

const HeaderComponent = React.memo(({ roadmap, Colors, styles }: any) => {
  const completedCount = roadmap.filter((d: any) => d.isCompleted).length;
  const totalCount = roadmap.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  return (
    <View style={styles.headerContainer}>
      <View style={styles.headerTextSection}>
        <Text style={styles.headerTitle}>خارطة الرحلة</Text>
        <Text style={styles.headerSubtitle}>
          خطة مفصلة للوصول إلى ختم القرآن الكريم
        </Text>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressTitle}>الإنجاز الكلي</Text>
          <Text style={styles.progressPercent}>
            {toArabicNumerals(Math.round(progressPct))}%
          </Text>
        </View>
        <View style={styles.mainProgressBarBg}>
          <View
            style={[
              styles.mainProgressBarFill,
              { width: `${progressPct}%`, backgroundColor: Colors.primary },
            ]}
          />
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{toArabicNumerals(completedCount)}</Text>
          <Text style={styles.statLabel}>أيام منجزة</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statVal}>{toArabicNumerals(totalCount)}</Text>
          <Text style={styles.statLabel}>إجمالي الأيام</Text>
        </View>
      </View>
    </View>
  );
});

// ============================================================
// Main Screen
// ============================================================

export default function PlanScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const { state, dispatch } = useAppStore();
  const selectionStore = useSelectionStore();
  const { plan, pageProgress } = state;

  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const roadmap = useMemo(() => {
    if (!plan || !plan.targetPages) return [];

    const memorizedPagesSet = new Set(
      pageProgress.filter((pg) => pg.memorized).map((pg) => pg.pageNumber),
    );

    const days: DayItem[] = [];
    const totalDays = plan.totalDays;
    let foundCurrent = false;

    for (let i = 0; i < totalDays; i++) {
      const startIndex = i * plan.pagesPerDay;
      const dayPages = plan.targetPages.slice(
        startIndex,
        startIndex + plan.pagesPerDay
      );
      if (dayPages.length === 0) continue;

      const start = Math.min(...dayPages);
      const end = Math.max(...dayPages);
      const pageNumbers = dayPages;
      const totalInRange = dayPages.length;

      let memorizedCount = 0;
      dayPages.forEach((p) => {
        if (memorizedPagesSet.has(p)) memorizedCount++;
      });

      const isCompleted = memorizedCount === totalInRange;
      let isCurrent = false;

      if (!isCompleted && !foundCurrent) {
        isCurrent = true;
        foundCurrent = true;
      }

      const surahs = SURAHS.filter(
        (s) =>
          (s.startPage <= start && s.endPage >= start) ||
          (s.startPage >= start && s.startPage <= end),
      ).map((s) => s.nameAr);
      const surahLabel = Array.from(new Set(surahs)).slice(0, 2).join("، ");

      const nextDayPages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay
      );
      const hasNext = nextDayPages.length > 0;
      const nextMin = hasNext ? Math.min(...nextDayPages) : 0;
      const nextMax = hasNext ? Math.max(...nextDayPages) : 0;

      const weeklyPages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay
      );
      const hasWeekly = weeklyPages.length > 0;
      const weeklyMin = hasWeekly ? Math.min(...weeklyPages) : 0;
      const weeklyMax = hasWeekly ? Math.max(...weeklyPages) : 0;

      const wardStart = ((i * 40) % 604) + 1;
      const wardEnd = ((wardStart + 39 - 1) % 604) + 1;
      const wardLabel =
        wardEnd >= wardStart
          ? `${toArabicNumerals(wardStart)} - ${toArabicNumerals(wardEnd)}`
          : `${toArabicNumerals(wardStart)} - ٦٠٤ و ١ - ${toArabicNumerals(
              wardEnd
            )}`;

      // Review usually looks back at what we ALREADY memorized
      const alreadyMemorized = plan.targetPages.slice(0, i * plan.pagesPerDay);
      const nearPages = alreadyMemorized.slice(-20); // Last 20 pages
      const distantPages = alreadyMemorized.slice(-60, -20); // Previous 40 pages

      const nearLabel =
        nearPages.length > 0
          ? `${toArabicNumerals(Math.min(...nearPages))} - ${toArabicNumerals(
              Math.max(...nearPages)
            )}`
          : "لا يوجد (بداية الخطة)";

      const distantLabel =
        distantPages.length > 0
          ? `${toArabicNumerals(Math.min(...distantPages))} - ${toArabicNumerals(
              Math.max(...distantPages)
            )}`
          : "لا يوجد بعد";

      const listenHizbStart = ((i * 10) % 604) + 1;
      const listenHizbEnd = ((listenHizbStart + 9) % 604) + 1;
      const listenLabel = listenHizbEnd >= listenHizbStart
        ? `${toArabicNumerals(listenHizbStart)} - ${toArabicNumerals(listenHizbEnd)}`
        : `${toArabicNumerals(listenHizbStart)} - ٦٠٤ و ١ - ${toArabicNumerals(listenHizbEnd)}`;

      const tasks: DayTask[] = [
        {
          id: "mem",
          label: `الحفظ الجديد: ${toArabicNumerals(start)} - ${toArabicNumerals(end)} (${toArabicNumerals(totalInRange)} صفحة)`,
          icon: "book",
          color: Colors.primary,
        },
        {
          id: "prep_p",
          label: `التحضير القبلي (١٥ د): قراءة ${toArabicNumerals(start)} - ${toArabicNumerals(end)} بسرعة`,
          icon: "flash-outline",
          color: Colors.fortressPreparation,
        },
        {
          id: "prep_n",
          label: hasNext
            ? `التحضير الليلي (٣٠ د): قراءة وسماع ${toArabicNumerals(nextMin)} - ${toArabicNumerals(nextMax)}`
            : "الاستعداد للختم المبارك",
          icon: "moon",
          color: Colors.warning,
        },
        {
          id: "prep_w",
          label: hasWeekly
            ? `التحضير الأسبوعي: قراءة صفحات الأسبوع القادم (${toArabicNumerals(weeklyMin)} - ${toArabicNumerals(weeklyMax)})`
            : "الأسابيع الأخيرة في الختمة",
          icon: "calendar-outline",
          color: Colors.fortressRecitation,
        },
        {
          id: "listen",
          label: `ختمة الاستماع (حزب): ${listenLabel}`,
          icon: "headset",
          color: Colors.blue,
        },
        {
          id: "rev_s",
          label: `المراجعة القريبة: ${nearLabel} (نصاب ٢٠ صفحة)`,
          icon: "refresh",
          color: Colors.success,
        },
        {
          id: "rev_l",
          label: `المراجعة البعيدة: ${distantLabel} (نصاب جزئين)`,
          icon: "sync",
          color: Colors.purple,
        },
        {
          id: "recit",
          label: `ورد التلاوة (جزئين): ${wardLabel}`,
          icon: "eye",
          color: Colors.red,
        },
      ];

      days.push({
        dayIndex: i + 1,
        pages: { start, end },
        pageNumbers,
        surahLabel,
        isCurrent,
        isCompleted,
        completionPct: (memorizedCount / totalInRange) * 100,
        tasks,
      });
    }
    return days;
  }, [plan, pageProgress, Colors]);

  const handleToggle = useCallback((day: number) => {
    setExpandedDay((prev) => (prev === day ? null : day));
  }, []);

  const handleComplete = useCallback((item: DayItem) => {
    dispatch({ type: "MARK_PAGES_MEMORIZED", payload: { pages: item.pageNumbers } });
    dispatch({ type: "COMPLETE_ALL_TODAY" });

    const modulesToSync: { moduleId: any, start: number, end: number }[] = [
      { moduleId: 'memorization', start: item.pages.start, end: item.pages.end },
      { moduleId: 'preparation_before', start: item.pages.start, end: item.pages.end },
      { moduleId: 'recitation', start: ((item.dayIndex - 1) * 40 % 604) + 1, end: (((item.dayIndex - 1) * 40 % 604) + 39) % 604 + 1 },
      { moduleId: 'listening', start: ((item.dayIndex - 1) * 10 % 604) + 1, end: (((item.dayIndex - 1) * 10 % 604) + 9) % 604 + 1 },
    ];

    if (item.pages.start > 1) {
      modulesToSync.push({
        moduleId: "review_short",
        start: Math.max(1, item.pages.start - 20),
        end: Math.max(1, item.pages.start - 1),
      });
    }

    modulesToSync.forEach(m => {
      const alreadyExists = selectionStore.getModuleSelections(m.moduleId).find(s => 
        s.ranges.some(r => r.start === m.start && r.end === m.end)
      );
      if (alreadyExists) {
        if (!alreadyExists.isCompleted) selectionStore.completeTaskSelection(alreadyExists.id);
      } else {
        selectionStore.addTaskSelection(m.moduleId, [selectionStore.createPageRange(m.start, m.end)]);
        const latest = selectionStore.getLatestSelection(m.moduleId);
        if (latest) selectionStore.completeTaskSelection(latest.id);
      }
    });

    setShowCelebration(true);
  }, [dispatch, selectionStore]);

  const renderItem = useCallback(
    ({ item, index }: { item: DayItem; index: number }) => (
      <PlanDay
        item={item}
        expanded={expandedDay === item.dayIndex}
        onToggle={handleToggle}
        onComplete={handleComplete}
        Colors={Colors}
        styles={styles}
        isLast={index === roadmap.length - 1}
      />
    ),
    [expandedDay, handleToggle, handleComplete, Colors, styles, roadmap.length],
  );

  if (!plan) {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>لم يتم إنشاء خطة بعد</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={StyleSheet.absoluteFill}
      />
      <FlatList
        data={roadmap}
        renderItem={renderItem}
        keyExtractor={(item) => item.dayIndex.toString()}
        ListHeaderComponent={<HeaderComponent roadmap={roadmap} Colors={Colors} styles={styles} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
      {showCelebration && <CelebrationOverlay onComplete={() => setShowCelebration(false)} />}
    </View>
  );
}
