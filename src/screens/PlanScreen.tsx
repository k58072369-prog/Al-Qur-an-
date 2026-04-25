import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
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
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { getMushafEdition } from "../data/mushafEditions";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { Spacing, Typography, useTheme } from "../theme";
import {
  getMotivationalMessage,
  toArabicNumerals,
  todayISO,
} from "../utils/helpers";
import { DEV_CONFIG } from "../developerConfig";

// ── Components ────────────────────────────────────────────────────────────────
import { PlanDayCard } from "../components/plan/PlanDayCard";
import { PlanHeader } from "../components/plan/PlanHeader";
import { WeekGroupCard } from "../components/plan/WeekGroupCard";
import type { DayItem, DayTask, WeekGroup } from "../components/plan/types";

const { width } = Dimensions.get("window");

// ============================================================
// Celebration Overlay (inline — small component)
// ============================================================

const CELEBRATION_MESSAGES = [
  {
    title: "مبارك الإنجاز!",
    subtitle:
      "لقد أتممت وردك اليومي بنجاح، جعل الله القرآن ربيع قلبك ونور صدرك.",
    dua: "«يقال لصاحب القرآن اقرأ وارتقِ ورتل كما كنت ترتل في الدنيا»",
  },
  {
    title: "هنيئاً لك الرفعة!",
    subtitle:
      "خطوة ثابتة وعظيمة نحو ختم كتاب الله، استمر في هذا المسير المبارك.",
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

const CelebrationOverlay = ({ onComplete }: { onComplete: () => void }) => {
  const Colors = useTheme();
  const [msg] = useState(
    () =>
      CELEBRATION_MESSAGES[
        Math.floor(Math.random() * CELEBRATION_MESSAGES.length)
      ],
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
            fontFamily: Typography.heading,
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
            fontFamily: Typography.body,
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
              fontFamily: Typography.body,
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
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontFamily: Typography.heading,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            الحمد لله، استمرار
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ============================================================
// Helpers
// ============================================================

// Shared helpers imported from ../utils/planLogic
import {
  buildRanges,
  formatRanges,
  getSurahSegments,
} from "../utils/planLogic";

// ─── Build weekly calendar groups ────────────────────────────────────────────
function buildWeeklyCalendar(
  plan: any,
  roadmap: DayItem[],
  settingsActiveDays: number[],
): WeekGroup[] {
  const isDaily = plan?.planMode === "daily";
  const activeDows = new Set<number>(
    isDaily
      ? [0, 1, 2, 3, 4, 5, 6]
      : (plan?.activeDaysOfWeek ?? settingsActiveDays ?? [0, 1, 2, 3, 4]),
  );

  if (activeDows.size === 0) return [];

  // Parse the plan start date — handle timezone-safe parsing
  const rawDate = plan.startDate ?? new Date().toISOString().split("T")[0];
  const [y, m, d] = rawDate.split("-").map(Number);
  const startDate = new Date(y, m - 1, d);
  const startDow = startDate.getDay(); // 0=Sun..6=Sat

  const groups: WeekGroup[] = [];
  let roadmapIdx = 0;
  let calDay = 0;

  while (roadmapIdx < roadmap.length) {
    const weekDays: WeekGroup["days"] = [];
    let weekHasActive = false;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const dow = (startDow + calDay) % 7;

      const dayDate = new Date(startDate);
      dayDate.setDate(startDate.getDate() + calDay);
      dayDate.setHours(0, 0, 0, 0);
      const isToday = dayDate.getTime() === today.getTime();

      if (activeDows.has(dow) && roadmapIdx < roadmap.length) {
        weekDays.push({
          type: "active",
          item: roadmap[roadmapIdx],
          dow,
          isToday,
        });
        roadmapIdx++;
        weekHasActive = true;
      } else {
        weekDays.push({ type: "rest", dow, isToday });
      }
      calDay++;
    }

    if (!weekHasActive) break; // Safety guard

    const completedCount = weekDays.filter(
      (d) => d.type === "active" && d.item.isCompleted,
    ).length;
    const totalActiveCount = weekDays.filter((d) => d.type === "active").length;
    const isCurrentWeek = weekDays.some(
      (d) => d.type === "active" && d.item.isCurrent,
    );

    groups.push({
      weekNumber: groups.length + 1,
      days: weekDays,
      isCurrentWeek,
      completedCount,
      totalActiveCount,
    });
  }

  return groups;
}

// ============================================================
// View Mode Toggle
// ============================================================

const ViewToggle = ({
  mode,
  onToggle,
}: {
  mode: "daily" | "weekly";
  onToggle: () => void;
}) => {
  const Colors = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={viewToggleStyle.wrap}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.8}
        style={[
          viewToggleStyle.btn,
          {
            backgroundColor: Colors.surface,
            borderColor: Colors.border,
          },
        ]}
      >
        <Ionicons
          name={mode === "weekly" ? "list-outline" : "calendar-outline"}
          size={14}
          color={Colors.primary}
        />
        <Text style={[viewToggleStyle.text, { color: Colors.primary }]}>
          {mode === "weekly" ? "عرض يومي" : "عرض أسبوعي"}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const viewToggleStyle = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    alignItems: "flex-end",
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  text: {
    fontFamily: Typography.body,
    fontSize: 12,
    fontWeight: "600",
  },
});

// ============================================================
// Main Screen
// ============================================================

export default function PlanScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const { state, dispatch } = useAppStore();
  const selectionStore = useSelectionStore();
  const { plan, pageProgress } = state;
  const reviewStrategy = state.settings.reviewStrategy ?? "spaced";
  const settingsPlanMode = (state.settings as any).planMode ?? "daily";
  const settingsActiveDays: number[] = (state.settings as any)
    .activeDaysOfWeek ?? [0, 1, 2, 3, 4];

  const [expandedDay, setExpandedDay] = useState<number | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [viewMode, setViewMode] = useState<"daily" | "weekly">(
    settingsPlanMode,
  );

  const pulse = useSharedValue(1);
  const barWidth = useSharedValue(0);
  const loadingMsg = useMemo(() => getMotivationalMessage(), []);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1200 }),
        withTiming(1, { duration: 1200 }),
      ),
      -1,
      true,
    );
    barWidth.value = withTiming(1, { duration: 1500 });

    const timer = setTimeout(() => setIsReady(true), 1800);
    return () => clearTimeout(timer);
  }, []);

  const animatedPulse = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
    opacity: withTiming(pulse.value === 1 ? 0.8 : 1),
  }));

  const animatedBar = useAnimatedStyle(() => ({
    width: `${barWidth.value * 100}%`,
  }));

  // Sync view mode when settings change
  useEffect(() => {
    setViewMode(settingsPlanMode);
  }, [settingsPlanMode]);

  const edition = useMemo(() => {
    const editionId =
      (plan as any)?.mushafEditionId ??
      (state.settings as any).mushafEdition ??
      "madani_604";
    return getMushafEdition(editionId as any);
  }, [plan, state.settings]);

  // ─── Build flat roadmap (active days only) ─────────────────
  const roadmap = useMemo(() => {
    if (!isReady || !plan || !plan.targetPages) return [];

    const memorizedSet = new Set(
      pageProgress.filter((pg) => pg.memorized).map((pg) => pg.pageNumber),
    );

    const isDaily = plan?.planMode === "daily";
    const activeDows = new Set<number>(
      isDaily
        ? [0, 1, 2, 3, 4, 5, 6]
        : (plan?.activeDaysOfWeek ?? settingsActiveDays ?? [0, 1, 2, 3, 4]),
    );
    if (activeDows.size === 0) activeDows.add(new Date().getDay());

    const planDates: string[] = [];
    const _rawDate = plan.startDate ?? new Date().toISOString().split("T")[0];
    const [y, m, d] = _rawDate.split("-").map(Number);
    let currentDate = new Date(y, m - 1, d);

    while (planDates.length < plan.totalDays) {
      if (activeDows.has(currentDate.getDay())) {
        const _iso = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;
        planDates.push(_iso);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const today = todayISO();

    const days: DayItem[] = [];
    let foundCurrent = false;
    let currentFarStartIndex = 0;

    for (let i = 0; i < plan.totalDays; i++) {
      const startIdx = i * plan.pagesPerDay;
      const dayPages = plan.targetPages.slice(
        startIdx,
        startIdx + plan.pagesPerDay,
      );
      if (dayPages.length === 0) continue;

      const ranges = buildRanges(dayPages);
      const surahSegments = getSurahSegments(dayPages, edition);
      const surahLabel = surahSegments
        .map((s) => s.nameAr)
        .slice(0, 2)
        .join(" - ");

      const memorizedCount = dayPages.filter((p) => memorizedSet.has(p)).length;
      const isCompleted = memorizedCount === dayPages.length;
      let isCurrent = false;
      if (!isCompleted && !foundCurrent) {
        isCurrent = true;
        foundCurrent = true;
      }

      const mainLabel =
        surahSegments.length === 1
          ? `${surahSegments[0].nameAr} — صفحات ${formatRanges(ranges)}`
          : `${surahSegments.map((s) => s.nameAr).join(" + ")} — صفحات ${formatRanges(ranges)}`;

      const nextDayPages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay,
      );
      const nextSegments =
        nextDayPages.length > 0 ? getSurahSegments(nextDayPages, edition) : [];
      const nextLabel =
        nextSegments.length > 0
          ? nextSegments
              .map((s) => s.nameAr)
              .slice(0, 2)
              .join(" + ") +
            " — " +
            formatRanges(buildRanges(nextDayPages))
          : null;

      const weeklyPages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay,
      );
      const weeklyLabel =
        weeklyPages.length > 0
          ? getSurahSegments(weeklyPages, edition)
              .map((s) => s.nameAr)
              .slice(0, 2)
              .join(" + ") +
            " — " +
            formatRanges(buildRanges(weeklyPages))
          : null;

      // Review strategy
      const alreadyDone = plan.targetPages.slice(0, startIdx);
      let nearPages: number[];
      let farPages: number[];

      if (reviewStrategy === "spaced") {
        const NEAR_SIZE = 20;
        const FAR_SIZE = 40;
        nearPages =
          alreadyDone.length > 0
            ? alreadyDone.slice(Math.max(0, alreadyDone.length - NEAR_SIZE))
            : [];
        const olderPages =
          alreadyDone.length > NEAR_SIZE
            ? alreadyDone.slice(0, alreadyDone.length - NEAR_SIZE)
            : [];
        if (olderPages.length > 0) {
          if (olderPages.length <= FAR_SIZE) {
            farPages = [...olderPages];
          } else {
            farPages = [];
            for (let j = 0; j < FAR_SIZE; j++) {
              farPages.push(
                olderPages[(currentFarStartIndex + j) % olderPages.length],
              );
            }
            currentFarStartIndex =
              (currentFarStartIndex + FAR_SIZE) % olderPages.length;
          }
        } else {
          farPages = [];
        }
      } else if (reviewStrategy === "random") {
        const shuffled = [...alreadyDone].sort(
          () => Math.sin(i * 31 + 7) - 0.5,
        );
        nearPages = shuffled.slice(0, Math.min(20, shuffled.length));
        farPages = shuffled.slice(20, Math.min(60, shuffled.length));
      } else {
        nearPages =
          alreadyDone.length > 0
            ? alreadyDone.slice(Math.max(0, alreadyDone.length - 20))
            : [];
        farPages =
          alreadyDone.length > 20
            ? alreadyDone.slice(
                Math.max(0, alreadyDone.length - 60),
                alreadyDone.length - 20,
              )
            : [];
      }

      const nearSegments =
        nearPages.length > 0 ? getSurahSegments(nearPages, edition) : [];
      const nearLabel =
        nearSegments.length > 0
          ? nearSegments
              .map((s) => s.nameAr)
              .slice(0, 2)
              .join(" + ") +
            " (ص " +
            formatRanges(buildRanges(nearPages)) +
            ")"
          : "لا يوجد (بداية الخطة)";

      const distantSegments =
        farPages.length > 0 ? getSurahSegments(farPages, edition) : [];
      const distantLabel =
        distantSegments.length > 0
          ? distantSegments
              .map((s) => s.nameAr)
              .slice(0, 2)
              .join(" + ") +
            " (ص " +
            formatRanges(buildRanges(farPages)) +
            ")"
          : "لا يوجد بعد";

      const wardStart = ((i * 40) % edition.totalPages) + 1;
      const wardEnd = ((wardStart + 39 - 1) % edition.totalPages) + 1;
      const wardLabel =
        wardEnd >= wardStart
          ? `${toArabicNumerals(wardStart)} - ${toArabicNumerals(wardEnd)}`
          : `${toArabicNumerals(wardStart)} - ${toArabicNumerals(edition.totalPages)} و ١ - ${toArabicNumerals(wardEnd)}`;

      const listenStart = ((i * 10) % edition.totalPages) + 1;
      const listenEnd = ((listenStart + 9 - 1) % edition.totalPages) + 1;
      const listenLabel =
        listenEnd >= listenStart
          ? `${toArabicNumerals(listenStart)} - ${toArabicNumerals(listenEnd)}`
          : `${toArabicNumerals(listenStart)} - ${toArabicNumerals(edition.totalPages)} و ١ - ${toArabicNumerals(listenEnd)}`;

      const strategyLabel =
        reviewStrategy === "spaced"
          ? "تكرار متباعد"
          : reviewStrategy === "random"
            ? "عشوائي"
            : "الأحدث أولاً";

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
          label: `المراجعة القريبة (${strategyLabel}): ${nearLabel}`,
          icon: "refresh",
          color: Colors.success,
        },
        {
          id: "rev_l",
          label: `المراجعة البعيدة (${strategyLabel}): ${distantLabel}`,
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
        date: planDates[i],
        isLocked: DEV_CONFIG.unlockAllPlans ? false : planDates[i] > today,
      });
    }

    return days;
  }, [
    isReady,
    plan,
    pageProgress,
    edition,
    Colors,
    reviewStrategy,
    settingsActiveDays,
  ]);

  // ─── Build weekly calendar (only used in weekly view) ─────
  const weekGroups = useMemo<WeekGroup[]>(() => {
    if (viewMode !== "weekly" || !plan || roadmap.length === 0) return [];
    return buildWeeklyCalendar(plan, roadmap, settingsActiveDays);
  }, [viewMode, plan, roadmap, settingsActiveDays]);

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
      if (!plan) return;
      dispatch({
        type: "MARK_PAGES_MEMORIZED",
        payload: { pages: item.pageNumbers },
      });
      dispatch({ type: "COMPLETE_ALL_TODAY" });

      type ModuleId =
        | "memorization"
        | "preparation_before"
        | "preparation_night"
        | "preparation_weekly"
        | "recitation"
        | "listening"
        | "review_short"
        | "review_long";
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

      const i = item.dayIndex - 1;
      const startIdx = i * plan.pagesPerDay;
      const alreadyDone = plan.targetPages.slice(0, startIdx);

      const nextDayPages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay,
      );
      if (nextDayPages.length > 0) {
        modulesToSync.push({
          moduleId: "preparation_night",
          ranges: buildRanges(nextDayPages),
        });
      }

      const weeklyPages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay,
      );
      if (weeklyPages.length > 0) {
        modulesToSync.push({
          moduleId: "preparation_weekly",
          ranges: buildRanges(weeklyPages),
        });
      }

      let nearPages: number[] = [];
      let farPages: number[] = [];

      if (reviewStrategy === "spaced") {
        const NEAR_SIZE = 20;
        const FAR_SIZE = 40;
        nearPages =
          alreadyDone.length > 0
            ? alreadyDone.slice(Math.max(0, alreadyDone.length - NEAR_SIZE))
            : [];
        const olderPages =
          alreadyDone.length > NEAR_SIZE
            ? alreadyDone.slice(0, alreadyDone.length - NEAR_SIZE)
            : [];
        if (olderPages.length > 0) {
          if (olderPages.length <= FAR_SIZE) {
            farPages = [...olderPages];
          } else {
            let rotatingStart = 0;
            for (let day = 0; day < i; day++) {
              const dayAlreadyDone = plan.targetPages.slice(
                0,
                day * plan.pagesPerDay,
              );
              const dayOlder =
                dayAlreadyDone.length > NEAR_SIZE
                  ? dayAlreadyDone.slice(0, dayAlreadyDone.length - NEAR_SIZE)
                  : [];
              if (dayOlder.length > FAR_SIZE)
                rotatingStart = (rotatingStart + FAR_SIZE) % dayOlder.length;
            }
            for (let j = 0; j < FAR_SIZE; j++) {
              farPages.push(
                olderPages[(rotatingStart + j) % olderPages.length],
              );
            }
          }
        }
      } else if (reviewStrategy === "random") {
        const shuffled = [...alreadyDone].sort(
          () => Math.sin(i * 31 + 7) - 0.5,
        );
        nearPages = shuffled.slice(0, Math.min(20, shuffled.length));
        farPages = shuffled.slice(20, Math.min(60, shuffled.length));
      } else {
        nearPages = alreadyDone.slice(Math.max(0, alreadyDone.length - 20));
        farPages = alreadyDone.slice(
          Math.max(0, alreadyDone.length - 60),
          Math.max(0, alreadyDone.length - 20),
        );
      }

      if (nearPages.length > 0)
        modulesToSync.push({
          moduleId: "review_short",
          ranges: buildRanges(nearPages),
        });
      if (farPages.length > 0)
        modulesToSync.push({
          moduleId: "review_long",
          ranges: buildRanges(farPages),
        });

      modulesToSync.forEach((m) => {
        const existing = selectionStore
          .getModuleSelections(m.moduleId)
          .find(
            (s) =>
              s.ranges.length === m.ranges.length &&
              s.ranges.every(
                (r, i) =>
                  r.start === m.ranges[i].start && r.end === m.ranges[i].end,
              ),
          );
        if (existing) {
          if (!existing.isCompleted)
            selectionStore.completeTaskSelection(existing.id);
        } else {
          selectionStore.addTaskSelection(
            m.moduleId,
            m.ranges.map((r) => selectionStore.createPageRange(r.start, r.end)),
          );
          const latest = selectionStore.getLatestSelection(m.moduleId);
          if (latest) selectionStore.completeTaskSelection(latest.id);
        }
      });

      setShowCelebration(true);
    },
    [dispatch, selectionStore, edition, plan, reviewStrategy],
  );

  // ─── Render items ──────────────────────────────────────────
  const renderDailyItem = useCallback(
    ({ item, index }: { item: DayItem; index: number }) => (
      <PlanDayCard
        item={item}
        expanded={expandedDay === item.dayIndex}
        onToggle={handleToggle}
        onComplete={handleComplete}
        isLast={index === roadmap.length - 1}
        showTimeline
      />
    ),
    [expandedDay, handleToggle, handleComplete, roadmap.length],
  );

  const renderWeeklyItem = useCallback(
    ({ item, index }: { item: WeekGroup; index: number }) => (
      <WeekGroupCard
        group={item}
        expandedDay={expandedDay}
        onToggle={handleToggle}
        onComplete={handleComplete}
        index={index}
      />
    ),
    [expandedDay, handleToggle, handleComplete],
  );

  // ─── Empty / Loading guards ───────────────────────────────
  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <View style={StyleSheet.absoluteFill} />
        <Ionicons name="map-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.emptyText}>لم يتم إنشاء خطة بعد</Text>
        <Text style={styles.emptySubText}>
          اذهب إلى الإعدادات لإنشاء خطة الحفظ
        </Text>
        <TouchableOpacity
          style={[styles.goSettingsBtn, { backgroundColor: Colors.primary }]}
          onPress={() => router.push("/settings" as any)}
        >
          <Ionicons name="settings-outline" size={16} color="#FFF" />
          <Text style={styles.goSettingsBtnText}>الإعدادات</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={
            Colors.background === "#07090F" ? "light-content" : "dark-content"
          }
          translucent
          backgroundColor="transparent"
        />
        <Animated.View
          entering={FadeIn.duration(600)}
          style={styles.loadingContainer}
        >
          <Animated.View style={[styles.loadingIconBox, animatedPulse]}>
            <Ionicons name="map-outline" size={52} color={Colors.primary} />
          </Animated.View>

          <View style={styles.loadingInfo}>
            <Text style={styles.loadingTitle}>تحضير الخطة...</Text>
            <Text style={styles.loadingSubtitle}>{loadingMsg}</Text>
          </View>

          <View style={styles.loadingBarWrapper}>
            <View style={styles.loadingBarBg}>
              <Animated.View style={[styles.loadingBarFill, animatedBar]} />
            </View>
            <Text style={styles.loadingProgressText}>جاري التهيئة</Text>
          </View>
        </Animated.View>
      </View>
    );
  }

  // ─── List header (shared) ─────────────────────────────────
  const ListHeader = (
    <>
      <PlanHeader roadmap={roadmap} plan={plan} />
      <ViewToggle
        mode={viewMode}
        onToggle={() =>
          setViewMode((v) => (v === "daily" ? "weekly" : "daily"))
        }
      />
    </>
  );

  // ─── Weekly view ──────────────────────────────────────────
  if (viewMode === "weekly") {
    return (
      <View style={styles.container}>
        <StatusBar
          barStyle={
            Colors.background === "#07090F" ? "light-content" : "dark-content"
          }
          translucent
          backgroundColor="transparent"
        />
        <FlatList
          data={weekGroups}
          renderItem={renderWeeklyItem}
          keyExtractor={(item) => `week-${item.weekNumber}`}
          ListHeaderComponent={ListHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          initialNumToRender={4}
          maxToRenderPerBatch={4}
          windowSize={5}
          removeClippedSubviews={true}
        />
        {showCelebration && (
          <CelebrationOverlay onComplete={() => setShowCelebration(false)} />
        )}
      </View>
    );
  }

  // ─── Daily view (default) ─────────────────────────────────
  return (
    <View style={styles.container}>
      <StatusBar
        barStyle={
          Colors.background === "#07090F" ? "light-content" : "dark-content"
        }
        translucent
        backgroundColor="transparent"
      />
      <FlatList
        data={roadmap}
        renderItem={renderDailyItem}
        keyExtractor={(item) => item.dayIndex.toString()}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={true}
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
    loadingContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: Colors.background,
      padding: Spacing.xl,
    },
    loadingIconBox: {
      width: 120,
      height: 120,
      borderRadius: 60,
      backgroundColor: Colors.surface,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: Spacing.xl * 2,
      borderWidth: 1,
      borderColor: `${Colors.primary}10`,
    },
    loadingInfo: {
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    loadingTitle: {
      fontFamily: Typography.heading,
      fontSize: 22,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
      letterSpacing: 0.5,
    },
    loadingSubtitle: {
      fontFamily: Typography.body,
      fontSize: 15,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
      paddingHorizontal: Spacing.xl,
      opacity: 0.8,
    },
    loadingBarWrapper: {
      width: "70%",
      alignItems: "center",
      marginTop: Spacing.xl,
    },
    loadingBarBg: {
      width: "100%",
      height: 4,
      backgroundColor: Colors.border,
      borderRadius: 2,
      overflow: "hidden",
      marginBottom: Spacing.sm,
    },
    loadingBarFill: {
      height: "100%",
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    loadingProgressText: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.textTertiary,
      textTransform: "uppercase",
      letterSpacing: 2,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.md,
      backgroundColor: Colors.background,
    },
    emptyText: {
      fontFamily: Typography.heading,
      fontSize: 17,
      color: Colors.textSecondary,
      fontWeight: "600",
    },
    emptySubText: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textTertiary,
    },
    goSettingsBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 14,
      marginTop: Spacing.sm,
    },
    goSettingsBtnText: {
      fontFamily: Typography.heading,
      fontSize: 14,
      fontWeight: "bold",
      color: "#FFF",
    },
    listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 120 },
  });
