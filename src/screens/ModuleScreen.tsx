import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";
import { MODULES, ModuleId, TaskSelection } from "../types";

import { RangeChip } from "../components/shared/RangeChip";
import { TaskCard } from "../components/shared/TaskCard";
import { SelectionScreen } from "../features/selection/SelectionScreen";
import { TaskTimer } from "../components/shared/TaskTimer";
import { AudioPlayer } from "../components/shared/AudioPlayer";

export default function ModuleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const { state, dispatch } = useAppStore();
  const selectionStore = useSelectionStore();

  const [showSelectionModal, setShowSelectionModal] = useState(false);
  const [timerVisible, setTimerVisible] = useState(false);
  const [audioPlayerVisible, setAudioPlayerVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskSelection | null>(null);

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
      case "recitation": return (state.settings.recitationTimerMinutes || 20) * 60;
      case "listening": return (state.settings.listeningTimerMinutes || 15) * 60;
      case "preparation_night":
      case "preparation_before":
      case "preparation_weekly": return (state.settings.preparationTimerMinutes || 15) * 60;
      case "memorization": return (state.settings.memorizationTimerMinutes || 20) * 60;
      case "review_short":
      case "review_long": return (state.settings.reviewTimerMinutes || 15) * 60;
      default: return 15 * 60;
    }
  };

  const moduleInfo = MODULES.find((m) => m.id === id);
  if (!moduleInfo) {
    return (
      <View style={[styles.container, { justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.emptyText}>القسم غير موجود</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}><Text style={styles.backBtnText}>العودة للرئيسية</Text></TouchableOpacity>
      </View>
    );
  }

  const selections = selectionStore.getModuleSelections(moduleInfo.id as ModuleId);
  const activeSelections = selections.filter((s) => !s.isCompleted);
  const completedSelections = selections.filter((s) => s.isCompleted);

  const handleComplete = (task: TaskSelection) => {
    selectionStore.completeTaskSelection(task.id);
    const pagesToMark: number[] = [];
    task.ranges.forEach((r) => { for (let p = r.start; p <= r.end; p++) pagesToMark.push(p); });

    if (moduleInfo.id === "memorization") {
      selectionStore.markPagesMemorized(pagesToMark);
      dispatch({ type: "MARK_PAGES_MEMORIZED", payload: { pages: pagesToMark } });
    } else if (moduleInfo.id === "review_short" || moduleInfo.id === "review_long") {
      pagesToMark.forEach(p => {
        selectionStore.reviewPage(p, true);
        dispatch({ type: "REVIEW_PAGE", payload: { pageNumber: p, passed: true } });
      });
    }

    dispatch({ type: "TOGGLE_FORTRESS", payload: { fortressId: moduleInfo.fortressId } });
    Alert.alert("إنجاز عظيم!", `أتممت ورد ${moduleInfo.nameAr}`);
  };

  const handleRemove = (taskId: string) => {
    Alert.alert("تأكيد", "هل تريد حذف هذا النطاق؟", [
      { text: "إلغاء", style: "cancel" },
      { text: "حذف", style: "destructive", onPress: () => selectionStore.removeTaskSelection(taskId) },
    ]);
  };

  const handleStartSession = (task: TaskSelection) => {
    setSelectedTask(task);
    if (moduleInfo.id === "listening") setAudioPlayerVisible(true);
    else setTimerVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => router.back()}><Ionicons name="chevron-forward" size={24} color={Colors.textPrimary} /></TouchableOpacity>
        <View style={styles.headerTitleContainer}><Text style={styles.headerTitle}>{moduleInfo.nameAr}</Text><Text style={styles.headerSubtitle}>{moduleInfo.description}</Text></View>
        <TouchableOpacity style={[styles.headerBtn, { backgroundColor: Colors.primaryMuted }]} onPress={() => setShowSelectionModal(true)}><Ionicons name="add" size={24} color={Colors.primary} /></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>الأوراد الحالية</Text>
          {activeSelections.length === 0 ? (
            <View style={styles.emptyBox}>
              <Ionicons name="document-text-outline" size={40} color={Colors.textTertiary} />
              <Text style={styles.emptyText}>لم تحدد أوراداً لهذا القسم بعد</Text>
            </View>
          ) : (
            activeSelections.map((task) => (
              <TaskCard 
                key={task.id} 
                task={task} 
                moduleColor={moduleInfo.color} 
                isListeningModule={moduleInfo.id === "listening"} 
                onRemove={handleRemove} 
                onComplete={handleComplete} 
                onStartSession={handleStartSession} 
                Colors={Colors} 
              />
            ))
          )}
        </View>

        {completedSelections.length > 0 && (
          <View style={[styles.section, { marginTop: Spacing.xl }]}>
            <Text style={styles.sectionTitle}>سجل الإنجاز</Text>
            {completedSelections.map((task) => (
              <View key={task.id} style={[styles.taskCardCompleted, { backgroundColor: Colors.surface, opacity: 0.6 }]}>
                <View style={styles.taskHeader}>
                  <Text style={[styles.taskDate, { color: Colors.textTertiary }]}>تم الإنجاز: {task.completedAt ? new Date(task.completedAt).toLocaleDateString("ar-EG") : ""}</Text>
                  <Ionicons name="checkmark-done" size={16} color={Colors.success} />
                </View>
                <View style={styles.rangesContainer}>
                  {task.ranges.map((r, i) => <RangeChip key={i} range={r} onRemove={() => {}} />)}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Modal visible={showSelectionModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setShowSelectionModal(false)}>
        <SelectionScreen moduleId={moduleInfo.id as ModuleId} moduleName={moduleInfo.nameAr} onClose={() => setShowSelectionModal(false)} />
      </Modal>

      {timerVisible && selectedTask && (
        <TaskTimer title={`جلسة ${moduleInfo.nameAr}`} initialSeconds={getRecommendedTime(moduleInfo.id)} task={selectedTask} onFinish={() => {}} onClose={() => setTimerVisible(false)} />
      )}

      <AudioPlayer visible={audioPlayerVisible} pages={getPagesFromTask(selectedTask)} title={`الاستماع لـ ${moduleInfo.nameAr}`} onClose={() => setAudioPlayerVisible(false)} />
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md, backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
    headerBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.glass, borderWidth: 1, borderColor: Colors.glass, alignItems: "center", justifyContent: "center" },
    headerTitleContainer: { alignItems: "center", flex: 1 },
    headerTitle: { fontFamily: Typography.heading, fontSize: Typography.lg, fontWeight: Typography.bold, color: Colors.textPrimary },
    headerSubtitle: { fontFamily: Typography.body, fontSize: Typography.xs, color: Colors.textSecondary },
    scroll: { padding: Spacing.lg, paddingBottom: 40 },
    section: { gap: Spacing.md },
    sectionTitle: { fontFamily: Typography.heading, fontSize: Typography.md, fontWeight: Typography.semibold, color: Colors.textPrimary, marginBottom: Spacing.xs },
    emptyBox: { alignItems: "center", padding: Spacing.xl, backgroundColor: Colors.glass, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.glassBorder, borderStyle: "dashed", gap: Spacing.md },
    emptyText: { fontFamily: Typography.body, fontSize: Typography.base, color: Colors.textSecondary },
    backBtn: { marginTop: Spacing.md, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.lg, backgroundColor: Colors.primaryMuted, borderRadius: BorderRadius.md },
    backBtnText: { color: Colors.primary, fontWeight: Typography.medium },
    taskCardCompleted: { borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: 'rgba(0,0,0,0.05)', padding: Spacing.md, gap: Spacing.md },
    taskHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)', paddingBottom: Spacing.sm },
    taskDate: { fontFamily: Typography.body, fontSize: Typography.xs },
    rangesContainer: { flexDirection: "row", flexWrap: "wrap", gap: Spacing.sm },
  });
