import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { getMushafEdition } from "../data/mushafEditions";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";
import { MODULES, ModuleId, TaskSelection } from "../types";
import { toArabicNumerals, todayISO } from "../utils/helpers";
import { buildRanges, formatRanges } from "../utils/planLogic";

const { width } = Dimensions.get("window");

import { AudioPlayer } from "../components/shared/AudioPlayer";
import { RangeChip } from "../components/shared/RangeChip";
import { TaskCard } from "../components/shared/TaskCard";
import { TaskTimer } from "../components/shared/TaskTimer";
import { InteractiveQuran } from "../components/shared/InteractiveQuran";
import { SelectionScreen } from "../features/selection/SelectionScreen";

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Colors = useTheme();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const { state, dispatch } = useAppStore();
  const selectionStore = useSelectionStore();

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [quranReaderVisible, setQuranReaderVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskSelection | null>(null);

  const { plan, pageProgress, settings } = state;

  const todayPlanItem = useMemo(() => {
    if (!plan || !plan.targetPages) return null;

    const _today = todayISO();
    const editionId =
      (plan as any).mushafEditionId ?? settings.mushafEdition ?? "madani_604";
    const edition = getMushafEdition(editionId as any);
    const settingsActiveDays = (settings as any).activeDaysOfWeek ?? [
      0, 1, 2, 3, 4,
    ];

    const isDaily = plan.planMode === "daily";
    const activeDows = new Set(
      isDaily
        ? [0, 1, 2, 3, 4, 5, 6]
        : (plan.activeDaysOfWeek ?? settingsActiveDays),
    );

    if (!activeDows.has(new Date().getDay())) return null;

    const startDate = plan.startDate ?? _today;
    const [y, m, d] = startDate.split("-").map(Number);
    let current = new Date(y, m - 1, d);
    let todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);

    let activeDayIndex = -1;
    let iterations = 0;
    while (current <= todayDate && iterations < 3650) {
      if (activeDows.has(current.getDay())) {
        activeDayIndex++;
      }
      current.setDate(current.getDate() + 1);
      iterations++;
    }

    if (activeDayIndex < 0 || activeDayIndex >= plan.totalDays) return null;

    const i = activeDayIndex;
    const startIdx = i * plan.pagesPerDay;
    const dayPages = plan.targetPages.slice(
      startIdx,
      startIdx + plan.pagesPerDay,
    );
    if (dayPages.length === 0) return null;

    const alreadyDone = plan.targetPages.slice(0, startIdx);

    // Map module ID to specific range logic
    let pages: number[] = [];
    if (id === "memorization" || id === "preparation_before") {
      pages = dayPages;
    } else if (id === "preparation_night") {
      pages = plan.targetPages.slice(
        (i + 1) * plan.pagesPerDay,
        (i + 2) * plan.pagesPerDay,
      );
    } else if (id === "preparation_weekly") {
      pages = plan.targetPages.slice(
        (i + 7) * plan.pagesPerDay,
        (i + 14) * plan.pagesPerDay,
      );
    } else if (id === "listening") {
      const listenStart = ((i * 10) % edition.totalPages) + 1;
      const listenEnd = ((listenStart + 9 - 1) % edition.totalPages) + 1;
      // Handle page wrap around for listening
      if (listenEnd >= listenStart) {
        for (let p = listenStart; p <= listenEnd; p++) pages.push(p);
      } else {
        for (let p = listenStart; p <= edition.totalPages; p++) pages.push(p);
        for (let p = 1; p <= listenEnd; p++) pages.push(p);
      }
    } else if (id === "recitation") {
      const wardStart = ((i * 40) % edition.totalPages) + 1;
      const wardEnd = ((wardStart + 39 - 1) % edition.totalPages) + 1;
      if (wardEnd >= wardStart) {
        for (let p = wardStart; p <= wardEnd; p++) pages.push(p);
      } else {
        for (let p = wardStart; p <= edition.totalPages; p++) pages.push(p);
        for (let p = 1; p <= wardEnd; p++) pages.push(p);
      }
    } else if (id === "review_short") {
      pages = alreadyDone.slice(alreadyDone.length - 20);
    } else if (id === "review_long") {
      pages = alreadyDone.slice(
        Math.max(0, alreadyDone.length - 60),
        Math.max(0, alreadyDone.length - 20),
      );
    }

    if (pages.length === 0) return null;
    return {
      ranges: buildRanges(pages),
      moduleTitle:
        id === "memorization"
          ? "حفظ اليوم"
          : id === "listening"
            ? "استماع اليوم"
            : id === "recitation"
              ? "تلاوة اليوم"
              : id?.includes("preparation")
                ? "تحضير اليوم"
                : "مراجعة اليوم",
    };
  }, [state.plan, state.settings, id]);

  const handleAddTodayPlan = () => {
    if (!todayPlanItem || !moduleInfo) return;
    selectionStore.addTaskSelection(
      moduleInfo.id as ModuleId,
      todayPlanItem.ranges.map((r) =>
        selectionStore.createPageRange(r.start, r.end),
      ),
    );
    Alert.alert("تم الإضافة", "تمت إضافة ورد الخطة إلى الأوراد الحالية");
  };

  const getPagesFromTask = (task: TaskSelection | null) => {
    if (!task) return [];
    const pages: number[] = [];
    task.ranges.forEach((r) => {
      for (let p = r.start; p <= r.end; p++) pages.push(p);
    });
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  const getRecommendedTime = (mId: string) => {
    switch (mId) {
      case "recitation":
        return (state.settings.recitationTimerMinutes || 20) * 60;
      case "listening":
        return (state.settings.listeningTimerMinutes || 15) * 60;
      case "preparation_night":
      case "preparation_before":
      case "preparation_weekly":
        return (state.settings.preparationTimerMinutes || 15) * 60;
      case "memorization":
        return (state.settings.memorizationTimerMinutes || 20) * 60;
      case "review_short":
      case "review_long":
        return (state.settings.reviewTimerMinutes || 15) * 60;
      default:
        return 15 * 60;
    }
  };

  const moduleInfo = MODULES.find((m) => m.id === id);
  if (!moduleInfo) {
    return (
      <View
        style={[
          styles.container,
          { justifyContent: "center", alignItems: "center" },
        ]}
      >
        <Text style={styles.emptyText}>القسم غير موجود</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>العودة للرئيسية</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const selections = selectionStore.getModuleSelections(
    moduleInfo.id as ModuleId,
  );
  const activeSelections = selections.filter((s) => !s.isCompleted);
  const completedSelections = selections.filter((s) => s.isCompleted);

  const handleComplete = (task: TaskSelection) => {
    selectionStore.completeTaskSelection(task.id);
    const pagesToMark: number[] = [];
    task.ranges.forEach((r) => {
      for (let p = r.start; p <= r.end; p++) pagesToMark.push(p);
    });

    if (moduleInfo.id === "memorization") {
      selectionStore.markPagesMemorized(pagesToMark);
      dispatch({
        type: "MARK_PAGES_MEMORIZED",
        payload: { pages: pagesToMark },
      });
    } else if (
      moduleInfo.id === "review_short" ||
      moduleInfo.id === "review_long"
    ) {
      pagesToMark.forEach((p) => {
        selectionStore.reviewPage(p, true);
        dispatch({
          type: "REVIEW_PAGE",
          payload: { pageNumber: p, passed: true },
        });
      });
    }

    dispatch({
      type: "TOGGLE_FORTRESS",
      payload: { fortressId: moduleInfo.fortressId },
    });
    Alert.alert("إنجاز عظيم!", `أتممت ورد ${moduleInfo.nameAr}`);
  };

  const handleRemove = (taskId: string) => {
    Alert.alert("تأكيد", "هل تريد حذف هذا النطاق؟", [
      { text: "إلغاء", style: "cancel" },
      {
        text: "حذف",
        style: "destructive",
        onPress: () => selectionStore.removeTaskSelection(taskId),
      },
    ]);
  };

  const groupedCompleted = useMemo(() => {
    const groups: { [date: string]: TaskSelection[] } = {};
    completedSelections.forEach((task) => {
      const dateKey = new Date(task.completedAt!).toDateString();
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(task);
    });
    return Object.entries(groups).sort(
      (a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime(),
    );
  }, [completedSelections]);

  const handleRemoveRange = (taskId: string, rangeId: string) => {
    const task = selections.find((s) => s.id === taskId);
    if (!task) return;
    const newRanges = task.ranges.filter((r) => r.id !== rangeId);
    if (newRanges.length === 0) {
      selectionStore.removeTaskSelection(taskId);
    } else {
      selectionStore.updateTaskRanges(taskId, newRanges);
    }
  };

  const handleClearAll = () => {
    Alert.alert(
      "مسح السجل",
      "هل أنت متأكد من حذف سجل الإنجاز بالكامل لهذا القسم؟ لا يمكن التراجع عن هذه الخطوة.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح الكل",
          style: "destructive",
          onPress: () =>
            selectionStore.clearModuleSelections(moduleInfo.id as ModuleId),
        },
      ],
    );
  };

  const handleStartSession = (task: TaskSelection) => {
    setSelectedTask(task);
    if (moduleInfo.id === "listening") {
      setAudioPlayerVisible(true);
    } else if (moduleInfo.id === "memorization") {
      setTimerVisible(true);
    } else {
      setQuranReaderVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={Colors.background === "#07090F" ? "light-content" : "dark-content"} 
        translucent 
        backgroundColor="transparent" 
      />
      {/* Background Glow */}
      <View
        style={[styles.bgGlow, { backgroundColor: `${moduleInfo.color}08` }]}
      />

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => router.back()}
        >
          <Ionicons
            name="chevron-forward"
            size={24}
            color={Colors.textPrimary}
          />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{moduleInfo.nameAr}</Text>
          {/* <View style={[styles.moduleBadge, { backgroundColor: `${moduleInfo.color}15` }]}>
             <Ionicons name={moduleInfo.icon} size={10} color={moduleInfo.color} />
             <Text style={[styles.moduleBadgeText, { color: moduleInfo.color }]}>{moduleInfo.fortressId}</Text>
          </View> */}
        </View>
        <TouchableOpacity
          style={[
            styles.headerBtn,
            {
              backgroundColor: Colors.primaryMuted,
              borderColor: `${Colors.primary}20`,
            },
          ]}
          onPress={() => setShowSelectionModal(true)}
        >
          <Ionicons name="add" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {todayPlanItem && (
          <Animated.View entering={FadeInDown} style={styles.planSuggestion}>
            <View style={styles.planSugHeader}>
              <View style={styles.planSugIcon}>
                <Ionicons name="sparkles" size={16} color={moduleInfo.color} />
              </View>
              <Text style={[styles.planSugTitle, { color: moduleInfo.color }]}>
                {todayPlanItem.moduleTitle}
              </Text>
              <View
                style={[
                  styles.planSugBadge,
                  { backgroundColor: `${moduleInfo.color}15` },
                ]}
              >
                <Text
                  style={[styles.planSugBadgeText, { color: moduleInfo.color }]}
                >
                  مقترح من الخطّة
                </Text>
              </View>
            </View>

            <View style={styles.planSugContent}>
              <Text style={styles.planSugRange}>
                صفحات: {formatRanges(todayPlanItem.ranges)}
              </Text>
              <TouchableOpacity
                style={[
                  styles.planSugAction,
                  { backgroundColor: moduleInfo.color },
                ]}
                onPress={handleAddTodayPlan}
              >
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.planSugActionText}>إضافة للأوراد</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>الأوراد الحالية</Text>
            {activeSelections.length > 0 && (
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {toArabicNumerals(activeSelections.length)}
                </Text>
              </View>
            )}
          </View>

          {activeSelections.length === 0 ? (
            <Animated.View entering={FadeInDown} style={styles.emptyBox}>
              <View style={styles.emptyIconCircle}>
                <Ionicons
                  name="document-text-outline"
                  size={40}
                  color={Colors.textTertiary}
                />
              </View>
              <Text style={styles.emptyText}>
                لم تحدد أوراداً لهذا القسم بعد
              </Text>
              <TouchableOpacity
                style={[
                  styles.addBtnSmall,
                  { backgroundColor: `${Colors.primary}15` },
                ]}
                onPress={() => setShowSelectionModal(true)}
              >
                <Text style={{ color: Colors.primary, fontWeight: "bold" }}>
                  أضف ورد الآن
                </Text>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            activeSelections.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                moduleColor={moduleInfo.color}
                isListeningModule={moduleInfo.id === "listening"}
                onRemove={handleRemove}
                onRemoveRange={handleRemoveRange}
                onComplete={handleComplete}
                onStartSession={handleStartSession}
                Colors={Colors}
              />
            ))
          )}
        </View>

        {groupedCompleted.length > 0 && (
          <View style={[styles.section, { marginTop: Spacing.xl * 1.5 }]}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: Spacing.md,
                paddingHorizontal: 4,
              }}
            >
              <Text style={[styles.sectionTitle, { fontSize: 20 }]}>
                سجل الإنجاز
              </Text>
              <TouchableOpacity
                onPress={handleClearAll}
                style={styles.clearBtn}
              >
                <Ionicons name="trash-outline" size={14} color={Colors.red} />
                <Text
                  style={{
                    color: Colors.red,
                    fontSize: 13,
                    fontWeight: "bold",
                  }}
                >
                  مسح السجل
                </Text>
              </TouchableOpacity>
            </View>

            {groupedCompleted.map(([date, tasks]) => (
              <View key={date} style={styles.dayGroup}>
                <View style={styles.dateDivider}>
                  <Text style={styles.dateLabel}>
                    {new Date(date).toLocaleDateString("ar-EG", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </Text>
                  <View style={styles.dateLine} />
                </View>

                {tasks.map((task) => (
                  <Animated.View
                    entering={FadeInDown}
                    key={task.id}
                    style={[
                      styles.taskCardCompleted,
                      { backgroundColor: Colors.surface },
                    ]}
                  >
                    <View style={styles.taskHeader}>
                      <View style={styles.timeTag}>
                        <Ionicons
                          name="time-outline"
                          size={12}
                          color={Colors.textTertiary}
                        />
                        <Text style={styles.taskDate}>
                          {new Date(task.completedAt!).toLocaleTimeString(
                            "ar-EG",
                            { hour: "2-digit", minute: "2-digit" },
                          )}
                        </Text>
                      </View>

                      <View style={styles.completedActions}>
                        <View style={styles.statusBadge}>
                          <Ionicons
                            name="checkmark-circle"
                            size={14}
                            color={Colors.success}
                          />
                          <Text style={styles.statusText}>مكتمل</Text>
                        </View>
                        <TouchableOpacity
                          style={styles.deleteCircle}
                          onPress={() => handleRemove(task.id)}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={14}
                            color={Colors.red}
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <View style={styles.rangesContainer}>
                      {task.ranges.map((r, i) => (
                        <RangeChip
                          key={i}
                          range={r}
                          onRemove={(rid) => handleRemoveRange(task.id, rid)}
                        />
                      ))}
                    </View>
                  </Animated.View>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showSelectionModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSelectionModal(false)}
      >
        <SelectionScreen
          moduleId={moduleInfo.id as ModuleId}
          moduleName={moduleInfo.nameAr}
          onClose={() => setShowSelectionModal(false)}
        />
      </Modal>

      {timerVisible && selectedTask && (
        <TaskTimer
          title={`جلسة ${moduleInfo.nameAr}`}
          initialSeconds={getRecommendedTime(moduleInfo.id)}
          task={selectedTask}
          showRepetition={moduleInfo.id === "memorization"}
          showControls={moduleInfo.id === "memorization"}
          showSetup={moduleInfo.id === "memorization"}
          onFinish={() => {}}
          onClose={() => setTimerVisible(false)}
        />
      )}

      <AudioPlayer
        visible={audioPlayerVisible}
        pages={getPagesFromTask(selectedTask)}
        title={`الاستماع لـ ${moduleInfo.nameAr}`}
        onClose={() => setAudioPlayerVisible(false)}
      />

      <InteractiveQuran
        visible={quranReaderVisible}
        pages={getPagesFromTask(selectedTask)}
        moduleId={moduleInfo.id}
        moduleName={moduleInfo.nameAr}
        onClose={() => setQuranReaderVisible(false)}
        onComplete={() => {
           if (selectedTask) handleComplete(selectedTask);
        }}
      />
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    bgGlow: {
      position: "absolute",
      width: width,
      height: 400,
      top: -100,
      borderRadius: width / 2,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      zIndex: 10,
    },
    headerBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: Colors.surfaceElevated,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitleContainer: { alignItems: "center", flex: 1 },
    headerTitle: {
      fontFamily: Typography.heading,
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.textPrimary,
    },
    moduleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginTop: 4,
    },
    moduleBadgeText: {
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },
    scroll: { padding: Spacing.xl, paddingBottom: 60 },
    planSuggestion: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.xl,
    },
    planSugHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
      gap: 8,
    },
    planSugIcon: {
      width: 28,
      height: 28,
      borderRadius: 8,
      backgroundColor: Colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    planSugTitle: {
      fontFamily: Typography.heading,
      fontSize: 15,
      fontWeight: "bold",
    },
    planSugBadge: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 6,
      marginLeft: "auto",
    },
    planSugBadgeText: {
      fontSize: 10,
      fontWeight: "bold",
    },
    planSugContent: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    planSugRange: {
      fontSize: 18,
      color: Colors.textPrimary,
      flex: 1,
    },
    planSugAction: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 10,
      marginLeft: 12,
    },
    planSugActionText: {
      color: "#FFF",
      fontSize: 12,
      fontWeight: "bold",
    },
    section: { gap: Spacing.md },
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      marginBottom: Spacing.xs,
    },
    sectionTitle: {
      fontFamily: Typography.heading,
      fontSize: 17,
      fontWeight: "900",
      color: Colors.textPrimary,
    },
    countBadge: {
      backgroundColor: Colors.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    countBadgeText: {
      fontSize: 11,
      color: Colors.textSecondary,
      fontWeight: "bold",
    },
    emptyBox: {
      alignItems: "center",
      padding: Spacing.xl * 1.5,
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      borderStyle: "dashed",
      gap: Spacing.md,
    },
    emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.sm,
    },
    emptyText: {
      fontFamily: Typography.body,
      fontSize: 15,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    addBtnSmall: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 12,
      marginTop: Spacing.sm,
    },
    backBtn: {
      marginTop: Spacing.md,
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      backgroundColor: Colors.primaryMuted,
      borderRadius: BorderRadius.md,
    },
    backBtnText: { color: Colors.primary, fontWeight: Typography.medium },
    clearBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: Colors.redMuted,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
    },
    taskCardCompleted: {
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.border,
      padding: Spacing.lg,
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    taskHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: Spacing.md,
    },
    timeTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: Colors.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    taskDate: {
      fontFamily: Typography.body,
      fontSize: 11,
      color: Colors.textSecondary,
    },
    completedActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: `${Colors.success}12`,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
    },
    statusText: { fontSize: 11, color: Colors.success, fontWeight: "bold" },
    deleteCircle: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: Colors.redMuted,
      alignItems: "center",
      justifyContent: "center",
    },
    rangesContainer: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: Spacing.sm,
    },
    dayGroup: {
      marginBottom: Spacing.lg,
    },
    dateDivider: {
      flexDirection: "row",
      alignItems: "center",
      marginVertical: Spacing.lg,
      gap: 12,
    },
    dateLine: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.border,
    },
    dateLabel: {
      fontSize: 14,
      fontWeight: "bold",
      color: Colors.textPrimary,
      fontFamily: Typography.heading,
      backgroundColor: Colors.surfaceElevated,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 8,
      overflow: "hidden",
    },
  });
