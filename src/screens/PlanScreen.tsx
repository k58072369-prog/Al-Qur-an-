import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { getMushafEdition } from "../data/mushafEditions";
import type { MushafEdition } from "../data/mushafEditions";
import { SURAHS } from "../data/quranMeta";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, useTheme } from "../theme";
import { toArabicNumerals } from "../utils/helpers";

const { width } = Dimensions.get("window");

// ============================================================
// Types
// ============================================================

type DayTask = {
  id: string;
  label: string;
  icon: any;
  color: string;
};

type SurahSegment = {
  surahId: number;
  nameAr: string;
  pages: number[];
};

type DayItem = {
  dayIndex: number;
  pageNumbers: number[];
  ranges: { start: number; end: number }[];
  surahSegments: SurahSegment[];
  surahLabel: string;
  isCurrent: boolean;
  isCompleted: boolean;
  completionPct: number;
  tasks: DayTask[];
};

// ============================================================
// Celebration Messages
// ============================================================

const MOTIVATIONAL_MESSAGES = [
  {
    title: "مبارك الإنجاز!",
    subtitle: "لقد أتممت وردك اليومي بنجاح، جعل الله القرآن ربيع قلبك ونور صدرك.",
    dua: "«يقال لصاحب القرآن اقرأ وارتقِ ورتل كما كنت ترتل في الدنيا»",
  },
  {
    title: "هنيئاً لك الرفعة!",
    subtitle: "خطوة ثابتة وعظيمة نحو ختم كتاب الله، استمر في هذا المسير المبارك.",
    dua: "«خيركم من تعلم القرآن وعلمه»",
  },
  {
    title: "رباط مع الخالق!",
    subtitle: "طبت وطاب لك العمل بصحبة كلام الله، يومك مشرق بالبركة والهدوء.",
    dua: "«أهل القرآن هم أهل الله وخاصته»",
  },
  {
    title: "توفيق من الله!",
    subtitle: "الثبات على الورد اليومي هو أعظم كرامة؛ فتشبث بحبله المتين.",
    dua: "«اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعًا لأصحابه»",
  },
  {
    title: "نور على نور!",
    subtitle: "أتممت وردك بصدق وإخلاص، هنيئاً لك السكينة التي نزلت على قلبك.",
    dua: "«ما اجتمع قوم في بيت من بيوت الله يتلون كتاب الله.. إلا نزلت عليهم السكينة»",
  },
];

// ============================================================
// Helpers
// ============================================================

/** Group contiguous pages into ranges */
function buildRanges(pages: number[]): { start: number; end: number }[] {
  if (!pages.length) return [];
  const res: { start: number; end: number }[] = [];
  let s = pages[0], e = pages[0];
  for (let i = 1; i < pages.length; i++) {
    if (pages[i] === e + 1) {
      e = pages[i];
    } else {
      res.push({ start: s, end: e });
      s = pages[i];
      e = pages[i];
    }
  }
  res.push({ start: s, end: e });
  return res;
}

function formatRanges(ranges: { start: number; end: number }[]): string {
  return ranges
    .map((r) =>
      r.start === r.end
        ? toArabicNumerals(r.start)
        : `${toArabicNumerals(r.start)}-${toArabicNumerals(r.end)}`
    )
    .join(" و ");
}

/** Find surah segments for a set of pages using edition data */
function getSurahSegments(
  pages: number[],
  edition: MushafEdition
): SurahSegment[] {
  const pageSet = new Set(pages);
  const segments: SurahSegment[] = [];

  const surahEntries = Object.entries(edition.surahPages)
    .map(([id, [s, e]]) => ({ id: Number(id), startPage: s, endPage: e }))
    .sort((a, b) => a.id - b.id);

  surahEntries.forEach(({ id, startPage, endPage }) => {
    const surahPages: number[] = [];
    for (let p = startPage; p <= endPage; p++) {
      if (pageSet.has(p)) surahPages.push(p);
    }
    if (surahPages.length > 0) {
      const surahMeta = SURAHS.find((s) => s.id === id);
      segments.push({
        surahId: id,
        nameAr: surahMeta?.nameAr ?? `سورة ${id}`,
        pages: surahPages,
      });
    }
  });

  return segments;
}

// ============================================================
// Sub-Components
// ============================================================

const CelebrationOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const Colors = useTheme();
  const [msg] = useState(
    () =>
      MOTIVATIONAL_MESSAGES[
        Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)
      ]
  );

  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        {
          zIndex: 10000,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        },
      ]}
    >
      <Animated.View
        entering={FadeInDown.duration(400).springify()}
        style={{
          width: width * 0.88,
          maxWidth: 380,
          backgroundColor: Colors.surface,
          borderRadius: 32,
          padding: 32,
          alignItems: "center",
          ...Shadow.lg,
          borderWidth: 1,
          borderColor: Colors.borderLight,
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: `${Colors.primary}15`,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <Ionicons name="medal-outline" size={48} color={Colors.primary} />
        </View>

        <Text
          style={{
            fontSize: 26,
            fontWeight: "bold",
            color: Colors.textPrimary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {msg.title}
        </Text>
        <Text
          style={{
            fontSize: 14,
            color: Colors.textSecondary,
            textAlign: "center",
            lineHeight: 22,
            marginBottom: 24,
          }}
        >
          {msg.subtitle}
        </Text>

        <View
          style={{
            padding: 20,
            backgroundColor: Colors.glass,
            borderRadius: 20,
            width: "100%",
            borderWidth: 1,
            borderColor: Colors.glassBorder,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              color: Colors.textPrimary,
              fontSize: 14,
              lineHeight: 24,
              textAlign: "center",
              fontWeight: "500",
              fontStyle: "italic",
            }}
          >
            {msg.dua}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onComplete}
          activeOpacity={0.8}
          style={{
            backgroundColor: Colors.primary,
            width: "100%",
            paddingVertical: 16,
            borderRadius: 18,
            alignItems: "center",
            ...Shadow.emerald,
          }}
        >
          <Text style={{ color: "#FFFFFF", fontSize: 16, fontWeight: "bold" }}>
            الحمد لله، استمرار
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Detail Task Row ─────────────────────────────────────────

const TaskRow = ({ icon, label, color, styles }: any) => (
  <View style={styles.taskRow}>
    <View style={[styles.taskIconBox, { backgroundColor: `${color}18` }]}>
      <Ionicons name={icon} size={14} color={color} />
    </View>
    <Text style={styles.taskText}>{label}</Text>
  </View>
);

// ─── Day Card ────────────────────────────────────────────────

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
    const primarySurah = item.surahSegments[0];
    const extraSurahCount = item.surahSegments.length - 1;

    const cardBorderColor = item.isCompleted
      ? Colors.success
      : item.isCurrent
      ? Colors.primary
      : Colors.border;

    const progressFill = item.isCompleted ? 100 : item.completionPct;

    return (
      <View style={styles.rowWrap}>
        {/* Timeline column */}
        <View style={styles.timelineCol}>
          <View
            style={[
              styles.timelineNode,
              item.isCompleted && {
                backgroundColor: Colors.success,
                borderColor: Colors.success,
              },
              item.isCurrent && { borderColor: Colors.primary, borderWidth: 2.5 },
            ]}
          >
            {item.isCompleted ? (
              <Ionicons name="checkmark" size={13} color="#FFF" />
            ) : (
              <View
                style={[
                  styles.timelineDot,
                  item.isCurrent && { backgroundColor: Colors.primary },
                ]}
              />
            )}
          </View>
          {!isLast && (
            <View
              style={[
                styles.timelineLine,
                item.isCompleted && { backgroundColor: Colors.success },
              ]}
            />
          )}
        </View>

        {/* Card */}
        <Animated.View
          entering={FadeIn.duration(250)}
          style={[styles.dayCard, { borderColor: cardBorderColor }]}
        >
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={() => onToggle(item.dayIndex)}
            style={styles.cardTouchable}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <View style={styles.dayNumBadge}>
                <Text
                  style={[
                    styles.dayNumText,
                    item.isCurrent && { color: Colors.primary },
                  ]}
                >
                  {toArabicNumerals(item.dayIndex)}
                </Text>
              </View>

              <View style={styles.cardMeta}>
                {/* Surah name(s) */}
                <View style={styles.surahRow}>
                  <Text style={styles.surahName} numberOfLines={1}>
                    {primarySurah?.nameAr ?? item.surahLabel}
                    {extraSurahCount > 0
                      ? ` + ${toArabicNumerals(extraSurahCount)}`
                      : ""}
                  </Text>
                  {item.isCurrent && (
                    <View style={[styles.badge, { backgroundColor: Colors.primary }]}>
                      <Text style={styles.badgeText}>اليوم</Text>
                    </View>
                  )}
                  {item.isCompleted && (
                    <View style={[styles.badge, { backgroundColor: Colors.success }]}>
                      <Text style={styles.badgeText}>✓</Text>
                    </View>
                  )}
                </View>

                {/* Page range */}
                <View style={styles.pageRangeRow}>
                  <Ionicons
                    name="book-outline"
                    size={11}
                    color={Colors.textTertiary}
                  />
                  <Text style={styles.pageRangeText}>
                    صفحات {formatRanges(item.ranges)}
                  </Text>
                  <Text style={styles.pageCountDot}>•</Text>
                  <Text style={styles.pageRangeText}>
                    {toArabicNumerals(item.pageNumbers.length)} ص
                  </Text>
                </View>
              </View>

              <Ionicons
                name={expanded ? "chevron-up" : "chevron-down"}
                size={16}
                color={expanded ? Colors.primary : Colors.textTertiary}
              />
            </View>

            {/* Surah breakdown chips */}
            {item.surahSegments.length > 1 && (
              <View style={styles.surahChips}>
                {item.surahSegments.map((seg) => (
                  <View
                    key={seg.surahId}
                    style={[
                      styles.surahChip,
                      { borderColor: `${Colors.primary}30` },
                    ]}
                  >
                    <Text style={[styles.surahChipText, { color: Colors.primary }]}>
                      {seg.nameAr}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Expanded tasks */}
            {expanded && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={styles.tasksSection}
              >
                <View style={styles.tasksDivider} />
                <Text style={styles.tasksTitle}>مهام هذا اليوم</Text>
                <View style={styles.tasksList}>
                  {item.tasks.map((task) => (
                    <TaskRow
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
                    style={[styles.completeBtn, { backgroundColor: Colors.primary }]}
                    onPress={() => onComplete(item)}
                  >
                    <Ionicons name="checkmark-circle" size={22} color="#FFF" />
                    <Text style={styles.completeBtnText}>
                      إتمام كافة مهام اليوم
                    </Text>
                  </TouchableOpacity>
                )}
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Progress bar */}
          {progressFill > 0 && (
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${progressFill}%`,
                    backgroundColor: item.isCompleted
                      ? Colors.success
                      : Colors.primary,
                  },
                ]}
              />
            </View>
          )}
        </Animated.View>
      </View>
    );
  }
);

// ─── Header ──────────────────────────────────────────────────

const PlanHeader = React.memo(({ roadmap, Colors, styles, plan }: any) => {
  const completedCount = roadmap.filter((d: any) => d.isCompleted).length;
  const totalCount = roadmap.length;
  const progressPct = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const currentDay = roadmap.find((d: any) => d.isCurrent);
  const currentDayIndex = currentDay
    ? currentDay.dayIndex
    : completedCount < totalCount
    ? completedCount + 1
    : totalCount;

  const totalYears = Math.floor(totalCount / 355);
  const remaining = totalCount % 355;
  const totalMonths = Math.floor(remaining / 30);
  const totalDays = remaining % 30;

  const direction =
    plan?.direction === "backward" ? "من الناس للفاتحة" : "من الفاتحة للناس";
  const editionName = plan?.mushafEditionId
    ? getMushafEdition(plan.mushafEditionId as any)?.nameAr
    : "المصحف المدني";

  return (
    <View style={styles.header}>
      {/* Title Section */}
      <View style={styles.headerTop}>
        <Text style={styles.headerTitle}>خارطة الرحلة</Text>
        <View style={styles.headerBadgeRow}>
          <View
            style={[styles.headerChip, { backgroundColor: `${Colors.primary}15` }]}
          >
            <Ionicons
              name={plan?.direction === "backward" ? "arrow-back" : "arrow-forward"}
              size={10}
              color={Colors.primary}
            />
            <Text style={[styles.headerChipText, { color: Colors.primary }]}>
              {direction}
            </Text>
          </View>
        </View>
        <Text style={styles.headerSubtitle}>{editionName}</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsGrid}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: `${Colors.primary}10`, borderColor: `${Colors.primary}20` },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.primary }]}>
            {toArabicNumerals(currentDayIndex)}
          </Text>
          <Text style={styles.statLabel}>اليوم الحالي</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: `${Colors.success}10`, borderColor: `${Colors.success}20` },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.success }]}>
            {toArabicNumerals(completedCount)}
          </Text>
          <Text style={styles.statLabel}>أيام منجزة</Text>
        </View>
        <View
          style={[
            styles.statCard,
            { backgroundColor: `${Colors.warning}10`, borderColor: `${Colors.warning}20` },
          ]}
        >
          <Text style={[styles.statValue, { color: Colors.warning }]}>
            {toArabicNumerals(totalCount - completedCount)}
          </Text>
          <Text style={styles.statLabel}>متبقية</Text>
        </View>
      </View>

      {/* Progress section */}
      <View style={styles.progressSection}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>الإنجاز الكلي</Text>
          <Text style={[styles.progressPercent, { color: Colors.primary }]}>
            {toArabicNumerals(Math.round(progressPct))}٪
          </Text>
        </View>
        <View
          style={[styles.progressBarBg, { height: 8, borderRadius: 4, marginTop: 8 }]}
        >
          <View
            style={[
              styles.progressBarFill,
              {
                height: "100%",
                borderRadius: 4,
                width: `${progressPct}%`,
                backgroundColor: Colors.primary,
              },
            ]}
          />
        </View>
      </View>

      {/* Duration */}
      <View style={styles.durationRow}>
        <Ionicons name="time-outline" size={13} color={Colors.textTertiary} />
        <Text style={styles.durationText}>
          مدة الرحلة:{" "}
          {totalYears > 0 ? `${toArabicNumerals(totalYears)} سنة ` : ""}
          {totalMonths > 0 ? `${toArabicNumerals(totalMonths)} شهر ` : ""}
          {toArabicNumerals(totalDays)} يوم
        </Text>
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

  // Get the mushaf edition used for this plan
  const edition = useMemo(() => {
    const editionId =
      (plan as any)?.mushafEditionId ??
      (state.settings as any).mushafEdition ??
      "madani_604";
    return getMushafEdition(editionId as any);
  }, [plan, state.settings]);

  const roadmap = useMemo(() => {
    if (!plan || !plan.targetPages) return [];

    const memorizedSet = new Set(
      pageProgress.filter((pg) => pg.memorized).map((pg) => pg.pageNumber)
    );

    const days: DayItem[] = [];
    let foundCurrent = false;

    for (let i = 0; i < plan.totalDays; i++) {
      const startIdx = i * plan.pagesPerDay;
      const dayPages = plan.targetPages.slice(
        startIdx,
        startIdx + plan.pagesPerDay
      );
      if (dayPages.length === 0) continue;

      // Build page ranges
      const ranges = buildRanges(dayPages);

      // Surah segments using edition data
      const surahSegments = getSurahSegments(dayPages, edition);

      // Surah label fallback
      const surahLabel = surahSegments
        .map((s) => s.nameAr)
        .slice(0, 2)
        .join(" - ");

      // Completion
      const memorizedCount = dayPages.filter((p) => memorizedSet.has(p)).length;
      const isCompleted = memorizedCount === dayPages.length;
      let isCurrent = false;
      if (!isCompleted && !foundCurrent) {
        isCurrent = true;
        foundCurrent = true;
      }

      // ─── Build task labels ──────────────────────────────────────
      const mainLabel = surahSegments.length === 1
        ? `${surahSegments[0].nameAr} — صفحات ${formatRanges(ranges)}`
        : `${surahSegments.map(s => s.nameAr).join(" + ")} — صفحات ${formatRanges(ranges)}`;

      const nextDayPages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay
      );
      const nextSegments =
        nextDayPages.length > 0 ? getSurahSegments(nextDayPages, edition) : [];
      const nextLabel =
        nextSegments.length > 0
          ? nextSegments.map((s) => s.nameAr).slice(0, 2).join(" + ") +
            " — " +
            formatRanges(buildRanges(nextDayPages))
          : null;

      const weeklyPages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay
      );
      const weeklySegments =
        weeklyPages.length > 0 ? getSurahSegments(weeklyPages, edition) : [];
      const weeklyLabel =
        weeklySegments.length > 0
          ? weeklySegments.map((s) => s.nameAr).slice(0, 2).join(" + ") +
            " — " +
            formatRanges(buildRanges(weeklyPages))
          : null;

      const alreadyDone = plan.targetPages.slice(0, startIdx);
      const nearReview = alreadyDone.slice(-20);
      const distantReview = alreadyDone.slice(-60, -20);

      const nearSegments =
        nearReview.length > 0 ? getSurahSegments(nearReview, edition) : [];
      const nearLabel =
        nearSegments.length > 0
          ? nearSegments.map((s) => s.nameAr).slice(0, 2).join(" + ") +
            " (ص " +
            formatRanges(buildRanges(nearReview)) +
            ")"
          : "لا يوجد (بداية الخطة)";

      const distantSegments =
        distantReview.length > 0 ? getSurahSegments(distantReview, edition) : [];
      const distantLabel =
        distantSegments.length > 0
          ? distantSegments.map((s) => s.nameAr).slice(0, 2).join(" + ") +
            " (ص " +
            formatRanges(buildRanges(distantReview)) +
            ")"
          : "لا يوجد بعد";

      const wardStart = ((i * 40) % edition.totalPages) + 1;
      const wardEnd = ((wardStart + 39 - 1) % edition.totalPages) + 1;
      const wardLabel =
        wardEnd >= wardStart
          ? `${toArabicNumerals(wardStart)} - ${toArabicNumerals(wardEnd)}`
          : `${toArabicNumerals(wardStart)} - ${toArabicNumerals(
              edition.totalPages
            )} و ١ - ${toArabicNumerals(wardEnd)}`;

      const listenStart = ((i * 10) % edition.totalPages) + 1;
      const listenEnd = ((listenStart + 9 - 1) % edition.totalPages) + 1;
      const listenLabel =
        listenEnd >= listenStart
          ? `${toArabicNumerals(listenStart)} - ${toArabicNumerals(listenEnd)}`
          : `${toArabicNumerals(listenStart)} - ${toArabicNumerals(
              edition.totalPages
            )} و ١ - ${toArabicNumerals(listenEnd)}`;

      const tasks: DayTask[] = [
        {
          id: "mem",
          label: `الحفظ الجديد: ${mainLabel}`,
          icon: "book",
          color: Colors.primary,
        },
        {
          id: "prep_p",
          label: `التحضير القبلي (١٥ د): قراءة ${mainLabel} بسرعة قبل الحفظ`,
          icon: "flash-outline",
          color: Colors.fortressPreparation,
        },
        {
          id: "prep_n",
          label: nextLabel
            ? `التحضير الليلي (٣٠ د): قراءة وسماع ${nextLabel}`
            : "الاستعداد للختم المبارك",
          icon: "moon",
          color: Colors.purple,
        },
        {
          id: "prep_w",
          label: weeklyLabel
            ? `التحضير الأسبوعي: قراءة ${weeklyLabel}`
            : "الأسابيع الأخيرة في الختمة",
          icon: "calendar-outline",
          color: Colors.fortressRecitation,
        },
        {
          id: "listen",
          label: `ختمة الاستماع (حزب): ص ${listenLabel}`,
          icon: "headset",
          color: Colors.blue,
        },
        {
          id: "rev_s",
          label: `المراجعة القريبة: ${nearLabel}`,
          icon: "refresh",
          color: Colors.success,
        },
        {
          id: "rev_l",
          label: `المراجعة البعيدة: ${distantLabel}`,
          icon: "sync",
          color: Colors.purple,
        },
        {
          id: "recit",
          label: `ورد التلاوة (جزءين): ص ${wardLabel}`,
          icon: "eye",
          color: Colors.red,
        },
      ];

      days.push({
        dayIndex: i + 1,
        pageNumbers: dayPages,
        ranges,
        surahSegments,
        surahLabel,
        isCurrent,
        isCompleted,
        completionPct: (memorizedCount / dayPages.length) * 100,
        tasks,
      });
    }

    return days;
  }, [plan, pageProgress, edition, Colors]);

  const initialScrollIndex = useMemo(() => {
    if (!roadmap.length) return 0;
    const idx = roadmap.findIndex((d) => d.isCurrent);
    return idx > 0 ? idx : 0;
  }, [roadmap]);

  const handleToggle = useCallback((day: number) => {
    setExpandedDay((prev) => (prev === day ? null : day));
  }, []);

  const handleComplete = useCallback(
    (item: DayItem) => {
      dispatch({
        type: "MARK_PAGES_MEMORIZED",
        payload: { pages: item.pageNumbers },
      });
      dispatch({ type: "COMPLETE_ALL_TODAY" });

      type ModuleId =
        | "memorization"
        | "preparation_before"
        | "recitation"
        | "listening"
        | "review_short";
      const modulesToSync: {
        moduleId: ModuleId;
        ranges: { start: number; end: number }[];
      }[] = [
        { moduleId: "memorization", ranges: item.ranges },
        { moduleId: "preparation_before", ranges: item.ranges },
        {
          moduleId: "recitation",
          ranges: [
            {
              start: (((item.dayIndex - 1) * 40) % edition.totalPages) + 1,
              end: (((item.dayIndex - 1) * 40 + 39) % edition.totalPages) + 1,
            },
          ],
        },
        {
          moduleId: "listening",
          ranges: [
            {
              start: (((item.dayIndex - 1) * 10) % edition.totalPages) + 1,
              end: (((item.dayIndex - 1) * 10 + 9) % edition.totalPages) + 1,
            },
          ],
        },
      ];

      const minPage = Math.min(...item.pageNumbers);
      if (minPage > 1) {
        modulesToSync.push({
          moduleId: "review_short",
          ranges: [
            { start: Math.max(1, minPage - 20), end: Math.max(1, minPage - 1) },
          ],
        });
      }

      modulesToSync.forEach((m) => {
        const existing = selectionStore
          .getModuleSelections(m.moduleId)
          .find(
            (s) =>
              s.ranges.length === m.ranges.length &&
              s.ranges.every(
                (r, i) =>
                  r.start === m.ranges[i].start && r.end === m.ranges[i].end
              )
          );
        if (existing) {
          if (!existing.isCompleted)
            selectionStore.completeTaskSelection(existing.id);
        } else {
          selectionStore.addTaskSelection(
            m.moduleId,
            m.ranges.map((r) => selectionStore.createPageRange(r.start, r.end))
          );
          const latest = selectionStore.getLatestSelection(m.moduleId);
          if (latest) selectionStore.completeTaskSelection(latest.id);
        }
      });

      setShowCelebration(true);
    },
    [dispatch, selectionStore, edition]
  );

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
    [expandedDay, handleToggle, handleComplete, Colors, styles, roadmap.length]
  );

  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <LinearGradient
          colors={[Colors.background, Colors.surface]}
          style={StyleSheet.absoluteFill}
        />
        <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>لم يتم إنشاء خطة بعد</Text>
        <Text style={styles.emptySubText}>
          اذهب إلى الإعدادات لإنشاء خطة الحفظ
        </Text>
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
        ListHeaderComponent={
          <PlanHeader
            roadmap={roadmap}
            Colors={Colors}
            styles={styles}
            plan={plan}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialScrollIndex={
          initialScrollIndex > 0 ? initialScrollIndex : undefined
        }
        getItemLayout={(_, index) => ({
          length: 110,
          offset: 110 * index,
          index,
        })}
        onScrollToIndexFailed={() => {}}
      />

      {showCelebration && (
        <CelebrationOverlay onComplete={() => setShowCelebration(false)} />
      )}
    </View>
  );
}

// ============================================================
// Styles
// ============================================================

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.md,
    },
    emptyText: { fontSize: 17, color: Colors.textSecondary, fontWeight: "600" },
    emptySubText: { fontSize: 13, color: Colors.textTertiary },

    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },

    // ─── Header ────────────────────────────────────────────────
    header: {
      paddingTop: 80,
      paddingBottom: Spacing.xl,
      paddingHorizontal: Spacing.xs,
    },
    headerTop: { marginBottom: Spacing.xl },
    headerTitle: {
      fontSize: 28,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginBottom: Spacing.xs,
    },
    headerSubtitle: {
      fontSize: 12,
      color: Colors.textTertiary,
      marginTop: 4,
    },
    headerBadgeRow: { flexDirection: "row", gap: Spacing.sm, marginTop: 6 },
    headerChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 20,
    },
    headerChipText: { fontSize: 11, fontWeight: "600" },

    statsGrid: {
      flexDirection: "row",
      gap: Spacing.sm,
      marginBottom: Spacing.xl,
    },
    statCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1,
      paddingVertical: Spacing.md,
      alignItems: "center",
    },
    statValue: { fontSize: 22, fontWeight: "bold" },
    statLabel: { fontSize: 10, color: Colors.textTertiary, marginTop: 2 },

    progressSection: { marginBottom: Spacing.md },
    progressRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    progressLabel: {
      fontSize: 13,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    progressPercent: { fontSize: 14, fontWeight: "bold" },
    progressBarBg: { backgroundColor: Colors.border, overflow: "hidden" },
    progressBarFill: {},

    durationRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: Spacing.md,
    },
    durationText: { fontSize: 12, color: Colors.textTertiary },

    // ─── Day Row ───────────────────────────────────────────────
    rowWrap: { flexDirection: "row", marginBottom: 0 },

    timelineCol: { width: 40, alignItems: "center" },
    timelineNode: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.surface,
      borderWidth: 2,
      borderColor: Colors.borderLight,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 10,
      marginTop: 20,
    },
    timelineDot: {
      width: 7,
      height: 7,
      borderRadius: 3.5,
      backgroundColor: Colors.borderLight,
    },
    timelineLine: {
      width: 2,
      flex: 1,
      backgroundColor: Colors.borderLight,
      marginVertical: 3,
    },

    // ─── Day Card ──────────────────────────────────────────────
    dayCard: {
      flex: 1,
      borderRadius: 16,
      borderWidth: 1.5,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      marginBottom: 18,
      marginRight: Spacing.sm,
      ...Shadow.sm,
      overflow: "hidden",
    },
    cardTouchable: { padding: Spacing.md },

    cardHeader: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: Spacing.sm,
    },
    dayNumBadge: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    dayNumText: {
      fontSize: 13,
      fontWeight: "bold",
      color: Colors.textSecondary,
    },

    cardMeta: { flex: 1 },

    surahRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
      flexWrap: "wrap",
      marginBottom: 4,
    },
    surahName: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.textPrimary,
      flexShrink: 1,
    },
    badge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: 6,
    },
    badgeText: { fontSize: 9, color: "#FFF", fontWeight: "bold" },

    pageRangeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      flexWrap: "wrap",
    },
    pageRangeText: { fontSize: 11, color: Colors.textTertiary },
    pageCountDot: { fontSize: 11, color: Colors.textTertiary },

    surahChips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 10 },
    surahChip: {
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 14,
      borderWidth: 1,
      backgroundColor: Colors.glass,
    },
    surahChipText: { fontSize: 11, fontWeight: "600" },

    // ─── Tasks ─────────────────────────────────────────────────
    tasksSection: { marginTop: Spacing.sm },
    tasksDivider: {
      height: 1,
      backgroundColor: Colors.borderLight,
      marginBottom: Spacing.md,
    },
    tasksTitle: {
      fontSize: 11,
      fontWeight: "bold",
      color: Colors.textSecondary,
      marginBottom: Spacing.sm,
      textAlign: "left",
    },
    tasksList: { gap: 10 },
    taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
    taskIconBox: {
      width: 28,
      height: 28,
      borderRadius: 8,
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    taskText: {
      flex: 1,
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "left",
      lineHeight: 18,
    },

    completeBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: Spacing.md,
      gap: Spacing.sm,
      ...Shadow.emerald,
    },
    completeBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  });
