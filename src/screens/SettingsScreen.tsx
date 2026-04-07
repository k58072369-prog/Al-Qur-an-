import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState, useEffect } from "react";
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
  Platform,
  Linking,
} from "react-native";
import { SURAHS } from "../data/quranMeta";
import { MUSHAF_EDITIONS, getMushafEdition } from "../data/mushafEditions";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { NotificationService } from "../store/NotificationService";
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
    | "recitationTimer"
    | "listeningTimer"
    | "startPage"
    | "endPage"
    | "planDirection"
    | "dailyAyahs"
    | "recitationTime"
    | "listeningTime"
    | "weeklyPrepTime"
    | "nightlyPrepTime"
    | "dailyPrepTime"
    | "memorizationTime"
    | "reviewTime"
  >("name");
  const [editValue, setEditValue] = useState("");
  const [surahModalVisible, setSurahModalVisible] = useState(false);
  const [selectionType, setSelectionType] = useState<
    "range" | "surahs" | "complete"
  >("complete");
  const [selectedSurahIds, setSelectedSurahIds] = useState<number[]>([]);
  const [tempStartPage, setTempStartPage] = useState("1");
  const [tempEndPage, setTempEndPage] = useState("");
  const [planDirection, setPlanDirection] = useState<"forward" | "backward">(
    "forward",
  );
  
  const [timePickerVisible, setTimePickerVisible] = useState(false);
  const [selectedHour, setSelectedHour] = useState(8);
  const [selectedMinute, setSelectedMinute] = useState(0);
  
  const [permStatus, setPermStatus] = useState<string>("undetermined");

  // Sync local state with store on mount
  useEffect(() => {
    if (state.plan) {
      setPlanDirection(state.plan.direction);
      const pages = state.plan.targetPages;
      if (pages.length > 0) {
        setTempStartPage(Math.min(...pages).toString());
        setTempEndPage(Math.max(...pages).toString());
      }
      
      // Try to determine selection type from label
      if (state.plan.label.includes("سور محددة") || state.plan.label.includes("سورة")) {
        setSelectionType("surahs");
        
        // Infer surah IDs from pages if selection is surahs
        const editionId = state.plan.mushafEditionId || state.settings.mushafEdition || 'madani_604';
        const edition = getMushafEdition(editionId as any);
        const pageSet = new Set(pages);
        const surahIds: number[] = [];
        
        Object.entries(edition.surahPages).forEach(([id, [start, end]]) => {
          // If any page of this surah is in our plan, it was likely selected
          for (let p = start; p <= end; p++) {
            if (pageSet.has(p)) {
              surahIds.push(Number(id));
              break;
            }
          }
        });
        setSelectedSurahIds(surahIds);
      } else if (state.plan.label.includes("من صفحة")) {
        setSelectionType("range");
      } else {
        setSelectionType("complete");
      }
    }
  }, [state.plan, state.settings.mushafEdition]);

  useEffect(() => {
    const checkPerms = async () => {
      const status = await NotificationService.getPermissionStatus();
      setPermStatus(status);
    };
    checkPerms();
  }, []);

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
      value = (state.settings.preparationTimerMinutes || 15).toString();
    else if (type === "recitationTimer")
      value = (state.settings.recitationTimerMinutes || 20).toString();
    else if (type === "listeningTimer")
      value = (state.settings.listeningTimerMinutes || 15).toString();
    else if (type === "recitationTime")
      value = state.settings.notifications.recitationTime;
    else if (type === "listeningTime")
      value = state.settings.notifications.listeningTime;
    else if (type === "weeklyPrepTime")
      value = state.settings.notifications.weeklyPrepTime;
    else if (type === "nightlyPrepTime")
      value = state.settings.notifications.nightlyPrepTime;
    else if (type === "dailyPrepTime")
      value = state.settings.notifications.dailyPrepTime;
    else if (type === "memorizationTime")
      value = state.settings.notifications.memorizationTime;
    else if (type === "reviewTime")
      value = state.settings.notifications.reviewTime;

    if (type.endsWith("Time")) {
      const [h, m] = value.split(':').map(Number);
      setSelectedHour(h || 0);
      setSelectedMinute(m || 0);
      setTimePickerVisible(true);
    } else {
      setEditValue(value);
      setEditModalVisible(true);
    }
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
    } else if (editType === "recitationTimer") {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { recitationTimerMinutes: parseInt(editValue, 10) || 20 },
      });
    } else if (editType === "listeningTimer") {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: { listeningTimerMinutes: parseInt(editValue, 10) || 15 },
      });
    } else if (
      editType === "recitationTime" ||
      editType === "listeningTime" ||
      editType === "weeklyPrepTime" ||
      editType === "nightlyPrepTime" ||
      editType === "dailyPrepTime" ||
      editType === "memorizationTime" ||
      editType === "reviewTime"
    ) {
      dispatch({
        type: "UPDATE_SETTINGS",
        payload: {
          notifications: {
            ...state.settings.notifications,
            [editType]: editValue,
          },
        },
      });
    } else {
      payload[editType as string] = editValue;
      dispatch({ type: "UPDATE_USER", payload });
    }
    setEditModalVisible(false);
  };

  const saveSelectedTime = () => {
    const formattedTime = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    dispatch({
      type: "UPDATE_SETTINGS",
      payload: {
        notifications: {
          ...state.settings.notifications,
          [editType]: formattedTime,
        },
      },
    });
    setTimePickerVisible(false);
  };

  const applyPlanChanges = (overrideEditionId?: string) => {
    let pages: number[] = [];
    let label = "";

    // جلب طبعة المصحف المختارة
    const editionId = overrideEditionId ?? (state.settings as any).mushafEdition ?? 'madani_604';
    const edition = getMushafEdition(editionId);
    const totalPages = edition.totalPages;

    if (selectionType === "complete") {
      pages = Array.from({ length: totalPages }, (_, i) => i + 1);
      label = `القرآن الكريم كاملاً — ${edition.nameAr}`;
    } else if (selectionType === "range") {
      const start = parseInt(tempStartPage, 10) || 1;
      const end = parseInt(tempEndPage, 10) || totalPages;
      const min = Math.max(1, Math.min(start, end));
      const max = Math.min(totalPages, Math.max(start, end));
      for (let p = min; p <= max; p++) pages.push(p);
      label = `من صفحة ${min} إلى ${max} — ${edition.nameAr}`;
    } else if (selectionType === "surahs") {
      const selected = SURAHS.filter((s) =>
        selectedSurahIds.includes(s.id),
      ).sort((a, b) => a.id - b.id);
      selected.forEach((s) => {
        // استخدم إحداثيات الطبعة لكل سورة
        const editionRange = edition.surahPages[s.id];
        const start = editionRange ? editionRange[0] : s.startPage;
        const end = editionRange ? editionRange[1] : s.endPage;
        for (let p = start; p <= end; p++) {
          if (!pages.includes(p)) pages.push(p);
        }
      });
      label =
        selected.length === 1
          ? `سورة ${selected[0].nameAr} — ${edition.nameAr}`
          : `مجموعة سور (${selected.length}) — ${edition.nameAr}`;
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

    Alert.alert("تم التحديث", `تم إنشاء خطة جديدة بتبعية ${edition.nameAr} (${edition.totalPages} صفحة) بنجاح`);
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
              // 1. Cancel all scheduled notifications first
              await NotificationService.cancelAllFortressReminders();

              // 2. Clear everything from storage
              await AsyncStorage.clear();
              console.log("[Settings] Storage cleared successfully");

              // 3. Clear memory states (AppStore & SelectionStore)
              dispatch({ type: "RESET" });
              useSelectionStore.getState().reset();

              // 4. Force redirect to entry point
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

      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/");
            }
          }}
        >
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
            <Text style={styles.label}>طاقتك اليومية (صفحات)</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.user?.dailyPages} صفحة/صفحات
              </Text>
              <Ionicons name="pencil" size={12} color={Colors.primary} />
            </View>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          طبعة المصحف الشريف
        </Text>
        <View style={styles.card}>
          <Text style={[styles.smallValue, { marginBottom: Spacing.md, lineHeight: 20 }]}>
            اختر طبعة المصحف التي تحفظ منها. سيتم بناء الخطة بناءً على أرقام صفحات هذه الطبعة تحديداً.
          </Text>
          {MUSHAF_EDITIONS.map((edition, idx) => {
            const currentEditionId = (state.settings as any).mushafEdition ?? 'madani_604';
            const isSelected = currentEditionId === edition.id;
            return (
              <React.Fragment key={edition.id}>
                <TouchableOpacity
                  style={[styles.infoRow, { alignItems: 'flex-start', paddingVertical: Spacing.md }]}
                  onPress={() => {
                    dispatch({
                      type: 'UPDATE_SETTINGS',
                      payload: { mushafEdition: edition.id } as any,
                    });
                    applyPlanChanges(edition.id);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      {isSelected && (
                        <View style={{
                          width: 8, height: 8, borderRadius: 4,
                          backgroundColor: Colors.primary,
                        }} />
                      )}
                      <Text style={[
                        styles.label,
                        isSelected && { color: Colors.primary, fontWeight: 'bold' }
                      ]}>
                        {edition.nameAr}
                      </Text>
                    </View>
                    <Text style={styles.smallValue}>{edition.description}</Text>
                    <Text style={[styles.smallValue, { color: Colors.textTertiary, fontFamily: Typography.body, fontSize: 10, marginTop: 2 }]}>
                      رواية: {edition.riwaya} • {edition.totalPages} صفحة
                    </Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isSelected ? Colors.primary : Colors.textTertiary}
                  />
                </TouchableOpacity>
                {idx < MUSHAF_EDITIONS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
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
                  placeholder={(getMushafEdition((state.settings as any).mushafEdition ?? 'madani_604').totalPages).toString()}
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
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("recitationTimer" as any)}
          >
            <Text style={styles.label}>مؤقت التلاوة</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.settings.recitationTimerMinutes} دقيقة
              </Text>
              <Ionicons name="time-outline" size={14} color={Colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity
            style={styles.infoRow}
            onPress={() => handleEdit("listeningTimer" as any)}
          >
            <Text style={styles.label}>مؤقت الاستماع</Text>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {state.settings.listeningTimerMinutes} دقيقة
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
          المظهر والتخصيص
        </Text>
        <View style={styles.card}>
          <View style={styles.themeRow}>
            <View>
              <Text style={styles.label}>مظهر التطبيق</Text>
              <Text style={styles.value}>
                {state.themeMode === "light" ? "الوضع الفاتح" : "الوضع الداكن"}
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
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          تنبيهات خماسية الحفظ
        </Text>

        <View style={{ marginBottom: Spacing.md, paddingHorizontal: Spacing.xs }}>
          <Text style={[styles.smallValue, { marginBottom: Spacing.sm }]}>أوضاع مقترحة للجدولة:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
            <TouchableOpacity 
              style={styles.templateBtn}
              onPress={() => dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  notifications: {
                    ...state.settings.notifications,
                    enabled: true,
                    recitationEnabled: true, recitationTime: "07:00",
                    listeningEnabled: true, listeningTime: "09:00",
                    weeklyPrepEnabled: true, weeklyPrepTime: "17:00",
                    nightlyPrepEnabled: true, nightlyPrepTime: "21:00",
                    dailyPrepEnabled: true, dailyPrepTime: "04:45",
                    memorizationEnabled: true, memorizationTime: "05:00",
                    reviewEnabled: true, reviewTime: "15:00",
                  }
                }
              })}
            >
              <Text style={styles.templateBtnText}>البكور (الفجر)</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.templateBtn}
              onPress={() => dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  notifications: {
                    ...state.settings.notifications,
                    enabled: true,
                    recitationEnabled: true, recitationTime: "08:00",
                    listeningEnabled: true, listeningTime: "10:00",
                    weeklyPrepEnabled: true, weeklyPrepTime: "18:00",
                    nightlyPrepEnabled: true, nightlyPrepTime: "22:00",
                    dailyPrepEnabled: true, dailyPrepTime: "05:45",
                    memorizationEnabled: true, memorizationTime: "06:00",
                    reviewEnabled: true, reviewTime: "16:00",
                  }
                }
              })}
            >
              <Text style={styles.templateBtnText}>قياسي (صباحي)</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.templateBtn}
              onPress={() => dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  notifications: {
                    ...state.settings.notifications,
                    enabled: true,
                    recitationEnabled: true, recitationTime: "10:00",
                    listeningEnabled: true, listeningTime: "12:00",
                    weeklyPrepEnabled: true, weeklyPrepTime: "20:00",
                    nightlyPrepEnabled: true, nightlyPrepTime: "23:00",
                    dailyPrepEnabled: true, dailyPrepTime: "07:45",
                    memorizationEnabled: true, memorizationTime: "08:00",
                    reviewEnabled: true, reviewTime: "17:00",
                  }
                }
              })}
            >
              <Text style={styles.templateBtnText}>متأخر</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        <View style={styles.card}>
          <View style={styles.themeRow}>
            <View>
              <Text style={styles.label}>تشغيل كافة التنبيهات</Text>
              <Text style={styles.value}>
                {state.settings.notifications.enabled ? "مفعّل" : "متوقف"}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.themeToggle}
              onPress={() => dispatch({
                type: "UPDATE_SETTINGS",
                payload: {
                  notifications: {
                    ...state.settings.notifications,
                    enabled: !state.settings.notifications.enabled
                  }
                }
              })}
            >
              <Ionicons
                name={state.settings.notifications.enabled ? "notifications-circle" : "notifications-off-circle"}
                size={22}
                color={state.settings.notifications.enabled ? Colors.primary : Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.divider} />

          {[
            { id: 'recitation', label: 'تنبيه التلاوة', field: 'recitationEnabled', timeField: 'recitationTime' },
            { id: 'listening', label: 'تنبيه الاستماع', field: 'listeningEnabled', timeField: 'listeningTime' },
            { id: 'weekly', label: 'التحضير الأسبوعي', field: 'weeklyPrepEnabled', timeField: 'weeklyPrepTime' },
            { id: 'nightly', label: 'التحضير الليلي', field: 'nightlyPrepEnabled', timeField: 'nightlyPrepTime' },
            { id: 'daily', label: 'التحضير القبلي', field: 'dailyPrepEnabled', timeField: 'dailyPrepTime' },
            { id: 'memorization', label: 'تنبيه الحفظ', field: 'memorizationEnabled', timeField: 'memorizationTime' },
            { id: 'review', label: 'تنبيه المراجعة', field: 'reviewEnabled', timeField: 'reviewTime' },
          ].map((item, idx, arr) => {
            const isMasterEnabled = state.settings.notifications.enabled;
            const isEnabled = (state.settings.notifications as any)[item.field];
            const time = (state.settings.notifications as any)[item.timeField];
            
            return (
              <React.Fragment key={item.id}>
                <View style={[styles.notificationRow, !isMasterEnabled && { opacity: 0.5 }]}>
                  <TouchableOpacity 
                    style={styles.notifMain}
                    disabled={!isMasterEnabled}
                    onPress={() => dispatch({
                      type: "UPDATE_SETTINGS",
                      payload: {
                        notifications: {
                          ...state.settings.notifications,
                          [item.field]: !isEnabled
                        }
                      }
                    })}
                  >
                    <Ionicons 
                      name={isEnabled && isMasterEnabled ? "notifications" : "notifications-off-outline"} 
                      size={20} 
                      color={isEnabled && isMasterEnabled ? Colors.primary : Colors.textTertiary} 
                    />
                    <Text style={[styles.label, { marginLeft: 12 }]}>{item.label}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity 
                    style={styles.timeBtn} 
                    disabled={!isMasterEnabled}
                    onPress={() => handleEdit(item.timeField)}
                  >
                    <Text style={styles.timeText}>{time}</Text>
                    <Ionicons name="time-outline" size={14} color={Colors.primary} />
                  </TouchableOpacity>
                </View>
                {idx < arr.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            );
          })}
        </View>

        <Text style={[styles.sectionTitle, { marginTop: Spacing.xl }]}>
          إدارة الصلاحيات
        </Text>
        <View style={styles.card}>
          <View style={styles.permRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>ظهور التنبيهات</Text>
              <Text style={[
                styles.smallValue, 
                { color: permStatus === "granted" ? Colors.primary : Colors.red }
              ]}>
                {permStatus === "granted" ? "مفعلة" : "غير مفعلة"}
              </Text>
            </View>
            <TouchableOpacity 
              style={[styles.permBtn, permStatus === "granted" && styles.permBtnDisabled]}
              onPress={async () => {
                const s = await NotificationService.requestPermissions();
                setPermStatus(s);
              }}
              disabled={permStatus === "granted"}
            >
              <Text style={styles.permBtnText}>
                {permStatus === "granted" ? "مكتمل" : "تفعيل"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.divider} />

          <TouchableOpacity 
            style={styles.actionRow}
            onPress={() => NotificationService.openNotificationSettings()}
          >
            <Ionicons name="settings-outline" size={16} color={Colors.textSecondary} />
            <Text style={[styles.label, { flex: 1, marginLeft: 10 }]}>إعدادات النظام المتقدمة</Text>
            <Ionicons name="chevron-back" size={14} color={Colors.textTertiary} />
          </TouchableOpacity>

          {Platform.OS === 'android' && (
            <>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>العمل في الخلفية</Text>
                  <Text style={styles.smallValue}>لضمان وصول التنبيهات حتى في وضع توفير الطاقة</Text>
                </View>
                <TouchableOpacity 
                  style={styles.permBtn}
                  onPress={() => Linking.openSettings()}
                >
                  <Text style={styles.permBtnText}>إعدادات البطارية</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
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
            <Text style={styles.value}>{Constants.expoConfig?.version || "1.0.0"} (BETA)</Text>
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
                      : editType === "dailyAyahs"
                        ? "الآيات اليومية"
                        : editType === "memorizationTimer"
                        ? "مؤقت الحفظ"
                        : editType === "reviewTimer"
                          ? "مؤقت المراجعة"
                          : editType === "preparationTimer"
                            ? "مؤقت التحضير"
                            : editType === "listeningTimer"
                              ? "مؤقت الاستماع"
                              : editType === "recitationTime"
                                ? "وقت تنبيه التلاوة"
                                : editType === "listeningTime"
                                  ? "وقت تنبيه الاستماع"
                                  : editType === "weeklyPrepTime"
                                    ? "وقت التحضير الأسبوعي"
                                    : editType === "nightlyPrepTime"
                                      ? "وقت التحضير الليلي"
                                      : editType === "dailyPrepTime"
                                        ? "وقت التحضير القبلي"
                                        : editType === "memorizationTime"
                                          ? "وقت تنبيه الحفظ"
                                          : editType === "reviewTime"
                                            ? "وقت تنبيه المراجعة"
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

      {/* Modern Time Picker Modal */}
      <Modal visible={timePickerVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingHorizontal: 0, maxHeight: '80%' }]}>
            <Text style={styles.modalTitle}>
              {editType === "recitationTime" ? "وقت التلاوة" :
               editType === "listeningTime" ? "وقت الاستماع" :
               editType === "weeklyPrepTime" ? "التحضير الأسبوعي" :
               editType === "nightlyPrepTime" ? "التحضير الليلي" :
               editType === "dailyPrepTime" ? "التحضير القبلي" :
               editType === "memorizationTime" ? "وقت الحفظ" :
               "وقت المراجعة"}
            </Text>
            
            <View style={styles.timePickerContainer}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>الساعة</Text>
                <ScrollView 
                  style={styles.timeList} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {Array.from({ length: 24 }, (_, i) => i).map(h => (
                    <TouchableOpacity 
                      key={h} 
                      style={[styles.timeItem, selectedHour === h && styles.timeItemActive]}
                      onPress={() => setSelectedHour(h)}
                    >
                      <Text style={[styles.timeItemText, selectedHour === h && styles.timeItemTextActive]}>
                        {h.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.timeColumn}>
                <Text style={styles.timeColumnLabel}>الدقيقة</Text>
                <ScrollView 
                  style={styles.timeList} 
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                >
                  {Array.from({ length: 12 }, (_, i) => i * 5).map(m => (
                    <TouchableOpacity 
                      key={m} 
                      style={[styles.timeItem, selectedMinute === m && styles.timeItemActive]}
                      onPress={() => setSelectedMinute(m)}
                    >
                      <Text style={[styles.timeItemText, selectedMinute === m && styles.timeItemTextActive]}>
                        {m.toString().padStart(2, '0')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={[styles.modalActions, { paddingHorizontal: Spacing.xl, marginTop: Spacing.lg }]}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalCancel]}
                onPress={() => setTimePickerVisible(false)}
              >
                <Text style={styles.modalCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalSave]}
                onPress={saveSelectedTime}
              >
                <Text style={styles.modalSaveText}>تأكيد</Text>
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
      fontFamily: Typography.heading, fontSize: Typography.lg,
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
      fontFamily: Typography.heading, fontSize: Typography.md,
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
      fontFamily: Typography.body, fontSize: Typography.sm,
      color: Colors.textTertiary,
      textAlign: "left",
    },
    value: {
      fontFamily: Typography.body, fontSize: Typography.sm,
      color: Colors.textPrimary,
      fontWeight: Typography.medium,
    },
    smallValue: {
      fontFamily: Typography.body, fontSize: 11,
      color: Colors.textSecondary,
      textAlign: 'left',
      lineHeight: 16,
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
    notificationRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 4,
    },
    notifMain: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    timeBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: Colors.background,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    timeText: {
      fontFamily: Typography.heading, fontSize: 13,
      fontWeight: "bold",
      color: Colors.primary,
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
      fontFamily: Typography.heading, fontSize: Typography.base,
      fontWeight: Typography.semibold,
    },
    unitToggle: {
      flexDirection: "row",
      backgroundColor: Colors.border,
      borderRadius: BorderRadius.md,
      padding: 2,
    },
    unitChip: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: BorderRadius.sm,
    },
    unitChipActive: {
      backgroundColor: Colors.surface,
      ...Shadow.sm,
    },
    unitChipText: {
      fontFamily: Typography.heading, fontSize: 10,
      color: Colors.textTertiary,
      fontWeight: 'bold',
    },
    unitChipTextActive: {
      color: Colors.primary,
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
      fontFamily: Typography.heading, fontSize: Typography.lg,
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
      fontFamily: Typography.body, fontSize: Typography.base,
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
      fontFamily: Typography.body, fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
    modalSaveText: {
      color: "#FFF",
      fontFamily: Typography.body, fontSize: Typography.sm,
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
      fontFamily: Typography.body, fontSize: Typography.xs,
      color: Colors.textTertiary,
      textAlign: "center",
    },
    surahNameAr: {
      flex: 1,
      fontFamily: Typography.body, fontSize: Typography.base,
      color: Colors.textPrimary,
      fontWeight: Typography.medium,
      textAlign: "left",
      paddingRight: Spacing.md,
    },
    surahPages: {
      fontFamily: Typography.body, fontSize: Typography.xs,
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
    tabText: { fontFamily: Typography.body, fontSize: 12, color: Colors.textTertiary },
    activeTabText: { color: Colors.primary, fontWeight: "bold" },
    rangeInputs: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: Spacing.md,
      marginBottom: Spacing.md,
    },
    inputGroup: { flex: 1 },
    inputLabel: {
      fontFamily: Typography.body, fontSize: 10,
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
    surahSelectText: { fontFamily: Typography.body, fontSize: 13, color: Colors.textPrimary },
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
    dirText: { fontFamily: Typography.body, fontSize: 11, color: Colors.textSecondary },
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
    applyBtnText: { color: "#FFF", fontFamily: Typography.heading, fontSize: 15, fontWeight: "bold" },
    timePickerContainer: {
      flexDirection: 'row',
      height: 200,
      paddingHorizontal: Spacing.xl,
    },
    timeColumn: {
      flex: 1,
      alignItems: 'center',
    },
    timeColumnLabel: {
      fontFamily: Typography.heading, fontSize: 10,
      color: Colors.textTertiary,
      marginBottom: 8,
      fontWeight: 'bold',
    },
    timeList: {
      width: '100%',
    },
    timeItem: {
      paddingVertical: 10,
      alignItems: 'center',
      borderRadius: 8,
      marginVertical: 2,
    },
    timeItemActive: {
      backgroundColor: `${Colors.primary}15`,
      borderWidth: 1,
      borderColor: `${Colors.primary}30`,
    },
    timeItemText: {
      fontFamily: Typography.body, fontSize: 18,
      color: Colors.textSecondary,
      fontWeight: '500',
    },
    timeItemTextActive: {
      color: Colors.primary,
      fontWeight: 'bold',
    },
    permRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    permBtn: {
      backgroundColor: `${Colors.primary}10`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: `${Colors.primary}20`,
    },
    permBtnDisabled: {
      backgroundColor: Colors.border,
      borderColor: Colors.border,
    },
    permBtnText: {
      fontFamily: Typography.heading, fontSize: 12,
      color: Colors.primary,
      fontWeight: 'bold',
    },
    actionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 4,
    },
    templateBtn: {
      backgroundColor: Colors.surface,
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: Colors.border,
      marginRight: 8,
    },
    templateBtnText: {
      fontFamily: Typography.heading, fontSize: 12,
      color: Colors.textSecondary,
      fontWeight: '600',
    },
  });
