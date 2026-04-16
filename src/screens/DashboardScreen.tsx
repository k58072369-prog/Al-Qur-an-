import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import VersionOverlay from "../components/VersionOverlay";
import { ModuleCard } from "../components/ModuleCard";
import { StreakBadge } from "../components/StreakBadge";
import { useAppStore } from "../store/AppStore";
import { UpdateService, UpdateInfo } from "../store/UpdateService";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";
import { MODULES, TaskSelection } from "../types";
import { getMotivationalMessage } from "../utils/helpers";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const { state, getMemorizedPages, getPagesDue } = useAppStore();
  const { user, streak, plan } = state;

  const [updateInfo, setUpdateInfo] = React.useState<UpdateInfo | null>(null);
  const [blockType, setBlockType] = React.useState<
    "disabled" | "force_update" | "optional_update" | null
  >(null);

  const checkVersion = React.useCallback(async () => {
    try {
      const info = await UpdateService.checkForUpdate();
      if (info) {
        setUpdateInfo(info);
        if (info.isAppDisabled) setBlockType("disabled");
        else if (info.isMandatory) setBlockType("force_update");
        else if (info.hasUpdate) setBlockType("optional_update");
        else setBlockType(null);
      }
    } catch (e) {
      console.warn("Failed to check version:", e);
    }
  }, []);

  React.useEffect(() => {
    checkVersion();
    if (blockType === "disabled" || blockType === "force_update") {
      const interval = setInterval(checkVersion, 30000);
      return () => clearInterval(interval);
    }
  }, [checkVersion, blockType]);

  const isLoaded = useSelectionStore((state) => state.isLoaded);
  const loadFromStorage = useSelectionStore((state) => state.loadFromStorage);
  const taskSelections = useSelectionStore((state) => state.taskSelections);

  useEffect(() => {
    if (!isLoaded) {
      loadFromStorage();
    }
  }, [isLoaded, loadFromStorage]);

  const memorizedPages = getMemorizedPages();
  const pagesDue = getPagesDue();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleModulePress = (id: string) => {
    router.push({ pathname: "/module", params: { id } } as any);
  };

  const todayStr = new Date().toDateString();
  const dailySelections = taskSelections.filter(
    (s: TaskSelection) => new Date(s.createdAt).toDateString() === todayStr,
  );
  const completedHousons = dailySelections.filter(
    (s: TaskSelection) => s.isCompleted,
  ).length;
  const totalHousonsCount = 5;
  const dailyCompletionPct =
    dailySelections.length > 0 ? completedHousons / dailySelections.length : 0;

  const memorizedCount = memorizedPages.length;
  const targetPagesCount = plan?.targetPages.length || 604;
  const remainingCount = targetPagesCount - memorizedCount;
  const pagesPerDay = user?.dailyPages || 1;
  const daysRemaining = Math.max(1, Math.ceil(remainingCount / pagesPerDay));
  const finishDate = new Date();
  finishDate.setDate(finishDate.getDate() + daysRemaining);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Modern Background Accents */}
      <View style={styles.backgroundAccent} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* New Creative Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.topRow}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.headerLogo}
              resizeMode="contain"
            />
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => router.push("/settings")}
              >
                <Ionicons
                  name="settings-outline"
                  size={20}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.greetingSection}>
            <View>
              <Text style={styles.greetingText}>
                {new Date().getHours() < 12 ? "صباح النور" : "مساء الخير"}،
              </Text>
              <Text style={styles.userName}>{user?.name ?? "يا حامل القرآن"}</Text>
            </View>
            <View style={styles.xpBadge}>
                <Ionicons name="sparkles" size={12} color={Colors.gold} />
                <Text style={styles.xpBadgeText}>{user?.totalXP ?? 0} نقطة</Text>
            </View>
          </View>

          <View style={styles.quoteCard}>
            <View style={styles.quoteLine} />
            <Text style={styles.quoteText}>{getMotivationalMessage()}</Text>
          </View>
        </Animated.View>

        {updateInfo && blockType && (
          <VersionOverlay
            type={blockType}
            info={updateInfo}
            onDismiss={() => setBlockType(null)}
            onRefresh={checkVersion}
          />
        )}

        {/* Improved Stats Overview Grid */}
        <View style={styles.statsOverview}>
            <View style={styles.mainStatCard}>
                <Text style={styles.mainStatLabel}>تقدمك الكلي</Text>
                <Text style={styles.mainStatValue}>{Math.round((memorizedCount / targetPagesCount) * 100)}%</Text>
                <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${(memorizedCount / targetPagesCount) * 100}%` }]} />
                </View>
                <Text style={styles.mainStatSub}>{memorizedCount} صفحة متممة</Text>
            </View>
            
            <View style={styles.sideStatsCol}>
                <View style={styles.sideStatCard}>
                    <Ionicons name="flame" size={18} color={Colors.gold} />
                    <View>
                        <Text style={styles.sideStatValue}>{streak.currentStreak}</Text>
                        <Text style={styles.sideStatLabel}>يوم متواصل</Text>
                    </View>
                </View>
                <View style={styles.sideStatCard}>
                    <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
                    <View>
                        <Text style={styles.sideStatValue}>
                            {finishDate.toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}
                        </Text>
                        <Text style={styles.sideStatLabel}>الختم المتوقع</Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Explanation Banner - Redesigned */}
        <TouchableOpacity
          style={styles.bannerLink}
          onPress={() => router.push("/explanation" as any)}
        >
          <View style={styles.bannerInner}>
            <View style={styles.bannerIconBox}>
                <Ionicons name="bulb-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.bannerText}>دليل البدء: كيف تعمل مفاتيح تثبيت القرآن؟</Text>
            <Ionicons name="chevron-back" size={16} color={Colors.textTertiary} />
          </View>
        </TouchableOpacity>

        {/* Navigation Sections */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>منهج الحفظ</Text>
          <View style={styles.pillBadge}>
            <Text style={styles.pillText}>{completedHousons}/5 أتممت</Text>
          </View>
        </View>

        <View style={styles.modulesGrid}>
          {MODULES.map((moduleInfo) => (
            <ModuleCard
              key={moduleInfo.id}
              moduleInfo={moduleInfo}
              onPress={handleModulePress}
            />
          ))}
        </View>

        {completedHousons >= 5 && (
          <View style={styles.completionMessage}>
             <View style={styles.completionIcon}>
                <Ionicons name="checkmark-done" size={24} color="#FFF" />
             </View>
             <Text style={styles.completionTitle}>هنيئاً لك إكمال ورد اليوم!</Text>
             <Text style={styles.completionDesc}>لقد أتممت جميع مراحل مفاتيح تثبيت القرآن لهذا اليوم.</Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    backgroundAccent: {
      position: "absolute",
      width: width * 1.2,
      height: 300,
      backgroundColor: `${Colors.primary}05`,
      borderRadius: width,
      top: -100,
      left: -width * 0.1,
    },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: 60, gap: Spacing.lg },

    header: { marginBottom: Spacing.md },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.xl,
    },
    headerLogo: { width: 100, height: 32 },
    headerActions: { flexDirection: "row", gap: Spacing.md },
    iconBtn: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },

    greetingSection: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-end",
      marginBottom: Spacing.lg,
    },
    greetingText: {
      fontFamily: Typography.body,
      fontSize: 16,
      color: Colors.textSecondary,
    },
    userName: {
      fontFamily: Typography.heading,
      fontSize: 24,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginTop: 2,
      textAlign: "left",
    },
    xpBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: `${Colors.gold}15`,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
        marginBottom: 4,
    },
    xpBadgeText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: Colors.gold,
    },

    quoteCard: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 12,
        paddingVertical: Spacing.md,
    },
    quoteLine: {
        width: 3,
        height: '100%',
        backgroundColor: Colors.primary,
        borderRadius: 2,
    },
    quoteText: {
        fontFamily: Typography.body,
        fontSize: 13,
        color: Colors.textSecondary,
        lineHeight: 20,
        textAlign: 'left',
    },

    statsOverview: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.sm,
    },
    mainStatCard: {
        flex: 1.2,
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 24,
        padding: Spacing.lg,
        borderWidth: 1.5,
        borderColor: Colors.primary,
    },
    mainStatLabel: { color: Colors.textSecondary, fontSize: 12, marginBottom: 4, textAlign: 'left' },
    mainStatValue: { color: Colors.primary, fontSize: 32, fontWeight: '900', marginBottom: 12, textAlign: 'left' },
    progressBarBg: { height: 8, backgroundColor: Colors.border, borderRadius: 4, marginBottom: 8 },
    progressBarFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },
    mainStatSub: { color: Colors.textTertiary, fontSize: 11, textAlign: 'left' },

    sideStatsCol: { flex: 1, gap: Spacing.md },
    sideStatCard: {
        flex: 1,
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 20,
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    sideStatValue: { fontSize: 16, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'left' },
    sideStatLabel: { fontSize: 9, color: Colors.textSecondary, textAlign: 'left' },

    bannerLink: {
        backgroundColor: Colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: Colors.border,
        padding: Spacing.md,
    },
    bannerInner: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    bannerIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: `${Colors.primary}10`,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: { flex: 1, fontSize: 13, color: Colors.textSecondary, textAlign: 'left' },

    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: Spacing.md,
    },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: Colors.textPrimary, textAlign: 'left' },
    pillBadge: { 
        backgroundColor: `${Colors.primary}10`, 
        paddingHorizontal: 10, 
        paddingVertical: 4, 
        borderRadius: 12 
    },
    pillText: { fontSize: 11, fontWeight: 'bold', color: Colors.primary },

    modulesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },

    completionMessage: {
        backgroundColor: Colors.surfaceElevated,
        borderRadius: 20,
        padding: Spacing.lg,
        alignItems: 'center',
        marginTop: Spacing.md,
        borderWidth: 1.5,
        borderColor: Colors.success,
    },
    completionIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: `${Colors.success}15`,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10,
    },
    completionTitle: { color: Colors.success, fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
    completionDesc: { color: Colors.textSecondary, fontSize: 12, textAlign: 'center' },
  });
