import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SURAHS } from "../data/quranMeta";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";

export default function SettingsScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const { state, dispatch } = useAppStore();

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editType, setEditType] = useState<
    | "name"
    | "goal"
    | "dailyPages"
    | "memorizationTimer"
    | "reviewTimer"
    | "preparationTimer"
    | "startPage"
    | "endPage"
    | "planDirection"
  >("name");
  const [editValue, setEditValue] = useState("");
  const [surahModalVisible, setSurahModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<
    "range" | "surahs" | "complete"
  >("complete");
  const [selectedSurahIds, setSelectedSurahIds] = useState<number[]>([]);
  const [tempStartPage, setTempStartPage] = useState("1");
  const [tempEndPage, setTempEndPage] = useState("604");
  const [planDirection, setPlanDirection] = useState<"forward" | "backward">(
    "forward",
  );

  const handleEdit = (type: string) => {
    setEditType(type as any);
    let value = "";
    if (type === "name") value = state.user?.name ?? "";
    else if (type === "goal") value = state.user?.goal ?? "";
    else if (type === "dailyPages")
      value = (state.user?.dailyPages ?? 0).toString();
    else if (type === "memorizationTimer")
      value = (state.settings.memorizationTimerMinutes ?? 15).toString();
    else if (type === "reviewTimer")
      value = (state.settings.reviewTimerMinutes ?? 15).toString();
    else if (type === "preparationTimer")
      value = (state.settings.preparationTimerMinutes ?? 15).toString();

    setEditValue(value);
    setEditModalVisible(true);
  };

  const saveEdit = () => {
    let payload: any = {};
    if (editType === "dailyPages") {
      payload.dailyPages = parseInt(editValue, 10) || 0;
      dispatch({ type: "UPDATE_USER", payload });
    } else if (editType === "memorizationTimer") {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { memorizationTimerMinutes: parseInt(editValue, 10) || 15 },
      });
    } else if (editType === "reviewTimer") {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { reviewTimerMinutes: parseInt(editValue, 10) || 15 },
      });
    } else if (editType === "preparationTimer") {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { preparationTimerMinutes: parseInt(editValue, 10) || 15 },
      });
    } else {
      payload[editType as string] = editValue;
      dispatch({ type: "UPDATE_USER", payload });
    }
    setEditModalVisible(false);
  };

  const applyPlanChanges = () => {
    let pages: number[] = [];
    let label = "";

    if (selectionType === "complete") {
      pages = Array.from({ length: 604 }, (_, i) => i + 1);
      label = "القرآن الكريم كاملاً";
    } else if (selectionType === "range") {
      const start = parseInt(tempStartPage, 10) || 1;
      const end = parseInt(tempEndPage, 10) || 604;
      const min = Math.min(start, end);
      const max = Math.max(start, end);
      for (let p = min; p <= max; p++) pages.push(p);
      label = `من صفحة ${min} إلى ${max}`;
    } else if (selectionType === "surahs") {
      const selected = SURAHS.filter((s) =>
        selectedSurahIds.includes(s.id),
      ).sort((a, b) => a.id - b.id);
      selected.forEach((s) => {
        for (let p = s.startPage; p <= s.endPage; p++) {
          if (!pages.includes(p)) pages.push(p);
        }
      });
      label =
        selected.length === 1
          ? `سورة ${selected[0].nameAr}`
          : `مجموعة سور (${selected.length})`;
    }

    if (pages.length === 0) {
      Alert.alert("خطأ", "يرجى اختيار نطاق صحيح");
      return;
    }

    dispatch({
      type: "REGENERATE_PLAN",
      payload: {
        pageNumbers: pages,
        label,
        direction: planDirection,
      },
    });

    Alert.alert("تم التحديث", "تم تحديث خطة الحفظ بنجاح");
  };

  const handleReset = () => {
    Alert.alert(
      "مسح البيانات بالكامل",
      "هل أنت متأكد من مسح جميع بيانات الحفظ والتقدم؟ هذا الإجراء لا يمكن التراجع عنه.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "مسح البيانات",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Clear everything from storage
              await AsyncStorage.clear();
              console.log("[Settings] Storage cleared successfully");
              
              // 2. Clear memory states (AppStore & SelectionStore)
              dispatch({ type: "RESET" });
              useSelectionStore.getState().reset();
              
              // 3. Force redirect to entry point
              router.replace("/" as any);
            } catch (e) {
              console.error("[Settings] Reset failed:", e);
              Alert.alert("خطأ", "فشل مسح البيانات، يرجى المحاولة مرة أخرى.");
            }
          },
        },
      ],
    );
  };

  const handleToggleTheme = () => {
    Alert.alert(
      "تغيير المظهر",
      "سيتم حفظ المظهر الجديد الآن. يرجى إغلاق التطبيق كلياً وإعادة فتحه لتطبيق الألوان الجديدة بشكل كامل.",
      [
        { text: "إلغاء", style: "cancel" },
        {
          text: "تبديل وحفظ",
          onPress: () => {
            dispatch({ type: "TOGGLE_THEME" });
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الإعدادات</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.sectionTitle}>معلومات الحساب</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("name")}
          >
            <Text style={styles.label}>الاسم</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{state.user?.name ?? "—"}</Text>
              <Ionicons name="pencil" size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("goal")}
          >
            <Text style={styles.label}>الهدف</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>{state.user?.goal ?? "—"}</Text>
              <Ionicons name="pencil" size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("dailyPages")}
          >
            <Text style={styles.label}>طاقتك اليومية</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.user?.dailyPages} صفحة/صفحات
              </Text>
              <Ionicons name="pencil" size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          إعدادات الحفظ (النطاق والاتجاه)
        </Text>
        <View style={styles.card}>
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[
                styles.tab,
                selectionType === "complete" && styles.activeTab,
              ]}
              onPress={() => setSelectionType("complete")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectionType === "complete" && styles.activeTabText,
                ]}
              >
                الختم الكامل
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectionType === "surahs" && styles.activeTab,
              ]}
              onPress={() => setSelectionType("surahs")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectionType === "surahs" && styles.activeTabText,
                ]}
              >
                سور محددة
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.tab,
                selectionType === "range" && styles.activeTab,
              ]}
              onPress={() => setSelectionType("range")}
            >
              <Text
                style={[
                  styles.tabText,
                  selectionType === "range" && styles.activeTabText,
                ]}
              >
                نطاق صفحات
              </Text>
            </TouchableOpacity>
          </View>

          {selectionType === "range" && (
            <View style={styles.rangeInputs}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>من صفحة</Text>
                <TextInput
                  style={styles.smallInput}
                  value={tempStartPage}
                  onChangeText={setTempStartPage}
                  keyboardType="numeric"
                  placeholder="1"
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>إلى صفحة</Text>
                <TextInput
                  style={styles.smallInput}
                  value={tempEndPage}
                  onChangeText={setTempEndPage}
                  keyboardType="numeric"
                  placeholder="604"
                />
              </View>
            </View>
          )}

          {selectionType === "surahs" && (
            <TouchableOpacity
              style={styles.surahSelectBtn}
              onPress={() => setSurahModalVisible(true)}
            >
              <Text style={styles.surahSelectText}>
                {selectedSurahIds.length === 0
                  ? "اضغط لاختيار السور"
                  : `تم اختيار ${selectedSurahIds.length} سورة`}
              </Text>
              <Ionicons name="list" size={16} color={Colors.primary} />
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          <View style={styles.directionRow}>
            <Text style={styles.label}>اتجاه الحفظ</Text>
            <View style={styles.directionToggle}>
              <TouchableOpacity
                style={[
                  styles.dirBtn,
                  planDirection === "forward" && styles.activeDirBtn,
                ]}
                onPress={() => setPlanDirection("forward")}
              >
                <Text
                  style={[
                    styles.dirText,
                    planDirection === "forward" && styles.activeDirText,
                  ]}
                >
                  من الفاتحة للناس
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.dirBtn,
                  planDirection === "backward" && styles.activeDirBtn,
                ]}
                onPress={() => setPlanDirection("backward")}
              >
                <Text
                  style={[
                    styles.dirText,
                    planDirection === "backward" && styles.activeDirText,
                  ]}
                >
                  من الناس للفاتحة
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.applyBtn} onPress={applyPlanChanges}>
            <Text style={styles.applyBtnText}>تطبيق الخطة الجديدة</Text>
            <Ionicons name="checkmark-done" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          إعدادات المؤقتات (دقائق)
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("memorizationTimer" as any)}
          >
            <Text style={styles.label}>مؤقت الحفظ</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.settings.memorizationTimerMinutes} دقيقة
              </Text>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("reviewTimer" as any)}
          >
            <Text style={styles.label}>مؤقت المراجعة</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.settings.reviewTimerMinutes} دقيقة
              </Text>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("preparationTimer" as any)}
          >
            <Text style={styles.label}>مؤقت التحضير</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.settings.preparationTimerMinutes} دقيقة
              </Text>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          إعدادات متقدمة
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() =>
              dispatch({
                type: "UPDATE_SETTINGS",
                payload: { hapticsEnabled: !state.settings.hapticsEnabled },
              })
            }
          >
            <View>
              <Text style={styles.label}>الاهتزاز والتفاعل (Haptics)</Text>
              <Text style={styles.value}>
                {state.settings.hapticsEnabled ? "مفعّل" : "معطّل"}
              </Text>
            </View>
            <Ionicons
              name={
                state.settings.hapticsEnabled ? "checkbox" : "square-outline"
              }
              size={20}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => {
              const strategies: ("spaced" | "random" | "recency")[] = [
                "spaced",
                "random",
                "recency",
              ];
              const currentIdx = strategies.indexOf(
                state.settings.reviewStrategy,
              );
              const next = strategies[(currentIdx + 1) % strategies.length];
              dispatch({
                type: "UPDATE_SETTINGS",
                payload: { reviewStrategy: next },
              });
            }}
          >
            <View>
              <Text style={styles.label}>استراتيجية المراجعة</Text>
              <Text style={styles.value}>
                {state.settings.reviewStrategy === "spaced"
                  ? "التكرار المتباعد (SSR)"
                  : state.settings.reviewStrategy === "random"
                    ? "عشوائي"
                    : "الأحدث أولاً"}
              </Text>
            </View>
            <Ionicons
              name="git-network-outline"
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() =>
              dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  showDailyProgressOnDashboard:
                    !state.settings.showDailyProgressOnDashboard,
                },
              })
            }
          >
            <View>
              <Text style={styles.label}>إظهار شريط الإنجاز في الرئيسية</Text>
              <Text style={styles.value}>
                {state.settings.showDailyProgressOnDashboard ? "نعم" : "لا"}
              </Text>
            </View>
            <Ionicons
              name={
                state.settings.showDailyProgressOnDashboard ? "eye" : "eye-off"
              }
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => {
              const next =
                state.settings.memorizationMethod === "standard"
                  ? "linking"
                  : "standard";
              dispatch({
                type: "UPDATE_SETTINGS",
                payload: { memorizationMethod: next },
              });
            }}
          >
            <View>
              <Text style={styles.label}>منهجية الحفظ</Text>
              <Text style={styles.value}>
                {state.settings.memorizationMethod === "standard"
                  ? "النموذج التقليدي (صفحات)"
                  : "نموذج الربط المتسلسل (للمتون)"}
              </Text>
            </View>
            <Ionicons
              name={
                state.settings.memorizationMethod === "standard"
                  ? "layers-outline"
                  : "link-outline"
              }
              size={18}
              color={Colors.primary}
            />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          التخصيص والتنبيهات
        </Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <View>
              <Text style={styles.label}>المظهر</Text>
              <Text style={styles.value}>
                {state.themeMode === "light" ? "فاتح" : "داكن"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={handleToggleTheme}
            >
              <Ionicons
                name={state.themeMode === "light" ? "sunny" : "moon"}
                size={18}
                color={Colors.primary}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() =>
              dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  notificationsEnabled: !state.settings.notificationsEnabled,
                },
              })
            }
          >
            <View>
              <Text style={styles.label}>التنبيهات اليومية</Text>
              <Text style={styles.value}>
                {state.settings.notificationsEnabled ? "مفعلة" : "معطلة"}
              </Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: state.settings.notificationsEnabled
                    ? `${Colors.success}15`
                    : `${Colors.red}15`,
                },
              ]}
            >
              <Text
                style={{
                  color: state.settings.notificationsEnabled
                    ? Colors.success
                    : Colors.red,
                  fontSize: 10,
                }}
              >
                {state.settings.notificationsEnabled ? "نشط" : "متوقف"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          حول التطبيق
        </Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => router.push("/legal")}
          >
            <View>
              <Text style={styles.label}>الشروط والخصوصية</Text>
              <Text style={styles.value}>
                اقرأ شروط الاستخدام وسياسة الخصوصية
              </Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={16}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
          <View style={styles.divider} />
          <View style={styles.infoRow}>
            <Text style={styles.label}>الإصدار</Text>
            <Text style={styles.value}>1.0.0 (BETA)</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          البيانات
        </Text>
        <TouchableOpacity
          style={[styles.card, styles.dangerBtn]}
          onPress={handleReset}
        >
          <Ionicons name="trash-outline" size={16} color={Colors.red} />
          <Text style={styles.dangerBtnText}>إعادة تعيين كافة البيانات</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      <Modal visible={editModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              تعديل{" "}
              {editType === "name"
                ? "الاسم"
                : editType === "startPage"
                  ? "بداية النطاق"
                  : editType === "endPage"
                    ? "نهاية النطاق"
                    : editType === "dailyPages"
                      ? "الصفحات اليومية"
                      : editType === "memorizationTimer"
                        ? "مؤقت الحفظ"
                        : editType === "reviewTimer"
                          ? "مؤقت المراجعة"
                          : editType === "preparationTimer"
                            ? "مؤقت التحضير"
                            : "الهدف"}
            </Text>
            <TextInput
              style={styles.modalInput}
              value={editValue}
              onChangeText={setEditValue}
              placeholder={`أدخل ${editType === "name" ? "الاسم" : "الهدف"}...`}
              placeholderTextColor={Colors.textTertiary}
              textAlign="right"
              keyboardType={editType === "dailyPages" ? "numeric" : "default"}
              autoFocus
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={saveEdit}
              >
                <Text style={styles.modalSaveText}>حفظ</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Surah Selection Modal (Multi-select) */}
      <Modal visible={surahModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { height: "90%" }]}>
            <Text style={styles.modalTitle}>اختر السور</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {SURAHS.map((surah) => {
                const isSelected = selectedSurahIds.includes(surah.id);
                return (
                  <TouchableOpacity
                    key={surah.id}
                    style={[
                      styles.surahItem,
                      isSelected && { backgroundColor: `${Colors.primary}10` },
                    ]}
                    onPress={() => {
                      if (isSelected) {
                        setSelectedSurahIds(
                          selectedSurahIds.filter((id) => id !== surah.id),
                        );
                      } else {
                        setSelectedSurahIds([...selectedSurahIds, surah.id]);
                      }
                    }}
                  >
                    <Ionicons
                      name={isSelected ? "checkbox" : "square-outline"}
                      size={20}
                      color={isSelected ? Colors.primary : Colors.textTertiary}
                    />
                    <Text
                      style={[
                        styles.surahNameAr,
                        isSelected && { color: Colors.primary },
                      ]}
                    >
                      {surah.nameAr}
                    </Text>
                    <Text style={styles.surahNumber}>{surah.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={() => setSurahModalVisible(false)}
              >
                <Text style={styles.modalSaveText}>تم الاختيار</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 56,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    backBtn: {
      width: 40,
      height: 40,
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    content: { padding: Spacing.xl },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
      textAlign: "left",
    },
    card: {
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 4,
    },
    valueRow: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
    label: {
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      textAlign: "left",
    },
    value: {
      fontSize: Typography.sm,
      color: Colors.textPrimary,
      fontWeight: Typography.medium,
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: Spacing.md,
    },
    themeRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    themeToggle: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: Colors.primaryMuted,
      borderWidth: 1,
      borderColor: `${Colors.primary}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    dangerBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.sm,
      borderColor: `${Colors.red}20`,
      backgroundColor: Colors.redMuted,
    },
    dangerBtnText: {
      color: Colors.red,
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
    },
    modalContent: {
      width: "85%",
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
    modalTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.lg,
      textAlign: "center",
    },
    modalInput: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
      padding: Spacing.md,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      marginBottom: Spacing.xl,
    },
    modalActions: {
      flexDirection: "row",
      justifyContent: "center",
      gap: Spacing.md,
    },
    modalButton: {
      flex: 1,
      paddingVertical: Spacing.md,
      borderRadius: BorderRadius.md,
      alignItems: "center",
    },
    modalCancel: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    modalSave: { backgroundColor: Colors.primary },
    modalCancelText: {
      color: Colors.textSecondary,
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
    modalSaveText: {
      color: "#FFF",
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
    surahItem: {
      flexDirection: "row-reverse",
      alignItems: "center",
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    surahNumber: {
      width: 30,
      fontSize: Typography.xs,
      color: Colors.textTertiary,
      textAlign: "center",
    },
    surahNameAr: {
      flex: 1,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      fontWeight: Typography.medium,
      textAlign: "left",
      paddingRight: Spacing.md,
    },
    surahPages: {
      fontSize: Typography.xs,
      color: Colors.textTertiary,
    },
    tabRow: {
      flexDirection: "row",
      backgroundColor: Colors.background,
      borderRadius: BorderRadius.md,
      padding: 4,
      marginBottom: Spacing.md,
    },
    tab: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: BorderRadius.md,
    },
    activeTab: { backgroundColor: Colors.surface, ...Shadow.sm },
    tabText: { fontSize: 12, color: Colors.textTertiary },
    activeTabText: { color: Colors.primary, fontWeight: "bold" },
    rangeInputs: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    inputGroup: { flex: 1 },
    inputLabel: {
      fontSize: 10,
      color: Colors.textTertiary,
      marginBottom: 4,
      textAlign: "right",
    },
    smallInput: {
      backgroundColor: Colors.background,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.sm,
      padding: 8,
      textAlign: "center",
      color: Colors.textPrimary,
    },
    surahSelectBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: Colors.background,
      padding: 12,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      marginBottom: Spacing.md,
    },
    surahSelectText: { fontSize: 13, color: Colors.textPrimary },
    directionRow: { marginBottom: Spacing.md },
    directionToggle: { flexDirection: "row", gap: Spacing.sm, marginTop: 8 },
    dirBtn: {
      flex: 1,
      paddingVertical: 10,
      backgroundColor: Colors.background,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.border,
      alignItems: "center",
    },
    activeDirBtn: {
      borderColor: Colors.primary,
      backgroundColor: `${Colors.primary}05`,
    },
    dirText: { fontSize: 11, color: Colors.textSecondary },
    activeDirText: { color: Colors.primary, fontWeight: "bold" },
    applyBtn: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 14,
      borderRadius: BorderRadius.lg,
      gap: Spacing.sm,
      marginTop: Spacing.sm,
      ...Shadow.emerald,
    },
    applyBtnText: { color: "#FFF", fontSize: 15, fontWeight: "bold" },
  });
