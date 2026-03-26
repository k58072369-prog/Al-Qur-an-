import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { ModuleCard } from "../components/ModuleCard";
import { StreakBadge } from "../components/StreakBadge";
import { useAppStore } from "../store/AppStore";
import { useSelectionStore } from "../store/selectionStore";
import { UpdateService } from "../store/UpdateService";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";
import { MODULES } from "../types";
import { getMotivationalMessage } from "../utils/helpers";

const { width } = Dimensions.get("window");

export default function DashboardScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const { state, getMemorizedPages, getPagesDue } = useAppStore();
  const { user, streak, plan } = state;

  const [updateInfo, setUpdateInfo] = React.useState<{
    hasUpdate: boolean;
    isMandatory: boolean;
    isAppDisabled: boolean;
    disabledMessage?: string;
    version?: string;
    changelog?: string;
    link?: string;
  }>({ hasUpdate: false, isMandatory: false, isAppDisabled: false });

  React.useEffect(() => {
    // Check for updates on mount
    const check = async () => {
      const info = await UpdateService.checkForUpdate();
      if (info) {
        setUpdateInfo({
          hasUpdate: info.hasUpdate,
          isMandatory: info.isMandatory,
          isAppDisabled: info.isAppDisabled,
          disabledMessage: info.disabledMessage,
          version: info.latestVersion,
          changelog: info.changelog,
          link: info.link,
        });
      }
    };
    check();
  }, []);

  const renderDisabledApp = () => (
    <View style={[StyleSheet.absoluteFill, styles.overlayContainer, { zIndex: 9999 }]}>
      <LinearGradient colors={["#0F172A", "#020617"]} style={StyleSheet.absoluteFill} />
      <View style={styles.overlayContent}>
        <View style={[styles.overlayIconBox, { backgroundColor: `${Colors.red}20` }]}>
          <Ionicons name="construct-outline" size={48} color={Colors.red} />
        </View>
        <Text style={styles.overlayTitle}>عذراً، التطبيق متوقف</Text>
        <Text style={styles.overlayDesc}>{updateInfo.disabledMessage}</Text>
        <Text style={styles.overlayHint}>يرجى مراجعة صفحاتنا الرسمية أو المحاولة لاحقاً.</Text>
      </View>
    </View>
  );

  const renderMandatoryUpdate = () => (
    <View style={[StyleSheet.absoluteFill, styles.overlayContainer, { zIndex: 9999 }]}>
      <LinearGradient colors={[Colors.primary, Colors.primaryDark]} style={StyleSheet.absoluteFill} />
      <View style={styles.overlayContent}>
        <View style={styles.overlayIconBoxWhite}>
          <Ionicons name="cloud-download" size={48} color={Colors.primary} />
        </View>
        <Text style={[styles.overlayTitle, { color: "#FFF" }]}>تحديث إلزامي مطلوب</Text>
        <Text style={[styles.overlayDesc, { color: "rgba(255,255,255,0.8)" }]}>
          الإصدار الحالي قديم جداً ولم يعد مدعوماً. يرجى التحديث للاستمرار في استخدام الحصون الخمسة.
        </Text>
        <Text style={[styles.overlayVersion, { color: "#FFF" }]}>الإصدار الجديد: {updateInfo.version}</Text>
        <TouchableOpacity 
          style={styles.overlayUpdateBtn}
          onPress={() => Linking.openURL(updateInfo.link || "https://github.com/mustafa-ahmad-work/alhousonalkhamsa/releases")}
        >
          <Text style={styles.overlayUpdateBtnText}>تحديث الآن</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (updateInfo.isAppDisabled) return renderDisabledApp();
  if (updateInfo.isMandatory) return renderMandatoryUpdate();

  const isLoaded = useSelectionStore((state) => state.isLoaded);
  const loadFromStorage = useSelectionStore((state) => state.loadFromStorage);
  const taskSelections = useSelectionStore((state) => state.taskSelections);

  // Load selections when Dashboard mounts
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
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleModulePress = (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push({ pathname: "/module", params: { id } } as any);
  };

  // Calculate daily completion for the Five Fortresses (Housons)
  const todayStr = new Date().toDateString();
  const dailySelections = taskSelections.filter((s) => new Date(s.createdAt).toDateString() === todayStr);
  const completedHousons = dailySelections.filter((s) => s.isCompleted).length;
  const totalHousonsCount = 5; // The 5 core system modules
  const dailyCompletionPct = dailySelections.length > 0 ? completedHousons / dailySelections.length : 0;
  // Expected Completion Logic
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

      {/* Subtle background orbs */}
      <View style={styles.orb1} />
      <View style={styles.orb2} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <Animated.View
          style={[
            styles.header,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.brandingHeader}>
            <View style={styles.headerLogoBox}>
              <Image 
                source={require("../../assets/images/logo.png")} 
                style={styles.logoImageHeader} 
                resizeMode="contain"
              />
            </View>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => router.push("/settings")}
            >
              <Ionicons
                name="settings-outline"
                size={18}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
          </View>

          {updateInfo.hasUpdate && (
            <TouchableOpacity
              style={styles.updateBanner}
              onPress={() =>
                Linking.openURL(
                  updateInfo.link ||
                    "https://github.com/mustafa-ahmad-work/alhousonalkhamsa/releases",
                )
              }
            >
              <LinearGradient
                colors={[Colors.primary, Colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.updateGradient}
              >
                <View style={[styles.updateInfo, { flexShrink: 1 }]}>
                  <Ionicons
                    name="cloud-download-outline"
                    size={20}
                    color="#FFF"
                  />
                  <View style={styles.updateTexts}>
                    <Text style={styles.updateTitle} numberOfLines={1}>
                      تحديث جديد: {updateInfo.version}!
                    </Text>
                    <Text
                      style={styles.updateDesc}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {updateInfo.changelog || "اضافات جديدة وتحسينات عامة"}
                    </Text>
                  </View>
                </View>
                <View style={styles.updateBtn}>
                  <Text style={styles.updateBtnText}>تحديث</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <View style={{ height: Spacing.sm }} />

          <View style={styles.headerTop}>
            <View style={styles.greetingBox}>
              <Text
                style={styles.greeting}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {new Date().getHours() < 12 ? "صباح الخير" : "مساء الخير"}،{" "}
                {user?.name ?? "أخي"}
              </Text>
              <Text style={styles.date}>
                {new Date().toLocaleDateString("ar-EG", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </View>
            <View style={styles.leftHeader}>
              <View style={styles.userBadge}>
                <Text style={styles.userTitle}>{user?.title ?? "مبتدئ"}</Text>
                <View style={styles.xpRow}>
                  <Text style={styles.xpText}>{user?.totalXP ?? 0}</Text>
                  <Ionicons name="star" size={10} color={Colors.gold} />
                </View>
              </View>
            </View>
          </View>

          {/* Quote */}
          <View style={styles.quoteBox}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={Colors.primary}
              style={{ marginTop: 1 }}
            />
            <Text style={styles.quoteText}>{getMotivationalMessage()}</Text>
          </View>
        </Animated.View>

        {/* App Explanation Banner */}
        <TouchableOpacity
          style={styles.explanationBanner}
          onPress={() => router.push("/explanation" as any)}
        >
          <View style={styles.explanationContent}>
            <View style={styles.explanationIcon}>
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={Colors.primary}
              />
            </View>
            <View style={{ flex: 1, alignItems: "flex-start" }}>
              <Text style={styles.explanationTitle}>شرح التطبيق</Text>
              <Text style={styles.explanationDesc}>
                تعرف على كيفية استخدام نظام الحصون الخمسة...
              </Text>
            </View>
            <Ionicons
              name="chevron-back"
              size={18}
              color={Colors.textTertiary}
            />
          </View>
        </TouchableOpacity>

        {/* Daily Fortress Progress Panel */}
        {state.settings.showDailyProgressOnDashboard && (
          <Animated.View style={[styles.statsPanel, { opacity: fadeAnim }]}>
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${Colors.primary}15` }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={Colors.primary} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>حصون اليوم</Text>
                  <Text style={styles.statValue}>{completedHousons} / {totalHousonsCount}</Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${Colors.gold}15` }]}>
                  <Ionicons name="sparkles-outline" size={20} color={Colors.gold} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>إنجاز اليوم</Text>
                  <Text style={styles.statValue}>{Math.round(dailyCompletionPct * 100)}%</Text>
                </View>
              </View>
            </View>

            <View style={[styles.statsRow, { marginTop: Spacing.sm }]}>
              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${Colors.blue}15` }]}>
                  <Ionicons name="book-outline" size={20} color={Colors.blue} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>الختم المتوقع</Text>
                  <Text style={styles.statValue} numberOfLines={1}>
                    {finishDate.toLocaleDateString("ar-EG", { day: 'numeric', month: "short" })}
                  </Text>
                </View>
              </View>

              <View style={styles.statCard}>
                <View style={[styles.statIconBox, { backgroundColor: `${Colors.warning}15` }]}>
                  <Ionicons name="time-outline" size={20} color={Colors.warning} />
                </View>
                <View style={styles.statInfo}>
                  <Text style={styles.statLabel}>أيام الاستمرارية</Text>
                  <Text style={styles.statValue}>{streak.currentStreak} يوم</Text>
                </View>
              </View>
            </View>
          </Animated.View>
        )}

        <StreakBadge
          currentStreak={streak.currentStreak}
          longestStreak={streak.longestStreak}
        />

        {/* Dynamic Modules Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>منهج الحصون</Text>
          <View style={styles.sectionBadge}>
            <Text style={styles.sectionBadgeText}>{MODULES.length} أقسام</Text>
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

        {/* All Done Message */}
        {completedHousons >= totalHousonsCount && (
          <View style={styles.allDoneBox}>
            <Ionicons name="medal-outline" size={40} color={Colors.primary} />
            <Text style={styles.allDoneTitle}>أحسنت! أتممت حصون اليوم</Text>
            <Text style={styles.allDoneSubtitle}>
              لقد أتممت نظام الحصون الخمسة لليوم بنجاح
            </Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    orb1: {
      position: "absolute",
      width: 280,
      height: 280,
      borderRadius: 140,
      backgroundColor: `${Colors.primary}06`,
      top: -60,
      right: -80,
    },
    orb2: {
      position: "absolute",
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: `${Colors.blue}04`,
      bottom: 200,
      left: -60,
    },
    scroll: {
      paddingHorizontal: Spacing.lg,
      paddingTop: 56,
      gap: Spacing.md,
    },
    header: {
      marginBottom: Spacing.xs,
    },
    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: Spacing.base,
    },
    leftHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
    },
    greetingBox: {
      flex: 1,
      alignItems: "flex-start",
    },
    settingsBtn: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: Colors.surface,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    updateBanner: {
      marginTop: Spacing.md,
      borderRadius: BorderRadius.lg,
      overflow: "hidden",
      ...Shadow.sm,
    },
    updateGradient: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.lg,
      height: 64,
    },
    updateInfo: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      flex: 1,
      marginRight: Spacing.sm,
    },
    updateTexts: {
      flex: 1,
    },
    updateTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: "#FFF",
    },
    updateDesc: {
      fontSize: 10,
      color: "rgba(255,255,255,0.8)",
    },
    updateBtn: {
      backgroundColor: "#FFF",
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 12,
      flexShrink: 0,
    },
    updateBtnText: {
      fontSize: 10,
      fontWeight: Typography.bold,
      color: Colors.primary,
    },
    userBadge: {
      alignItems: "center",
      gap: 3,
    },
    userTitle: {
      fontSize: Typography.xs,
      color: Colors.gold,
      fontWeight: Typography.semibold,
      backgroundColor: Colors.goldMuted,
      paddingHorizontal: Spacing.md,
      paddingVertical: 2,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: `${Colors.gold}15`,
      overflow: "hidden",
    },
    xpRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    xpText: {
      fontSize: 10,
      color: Colors.textTertiary,
    },
    greeting: {
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      textAlign: "left",
      width: "100%",
    },
    date: {
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      textAlign: "left",
      marginTop: 2,
    },
    quoteBox: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: Colors.primarySubtle,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: `${Colors.primary}0D`,
      padding: Spacing.md,
      gap: Spacing.sm,
    },
    quoteText: {
      flex: 1,
      fontSize: Typography.sm,
      color: Colors.primary,
      lineHeight: Typography.sm * 1.7,
      textAlign: "left",
      opacity: 0.85,
    },

    // Explanation Banner
    explanationBanner: {
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      padding: Spacing.md,
      marginBottom: Spacing.sm,
    },
    explanationContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    explanationIcon: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.primarySubtle,
      alignItems: "center",
      justifyContent: "center",
    },
    explanationTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
      marginBottom: 2,
      textAlign: "left",
    },
    explanationDesc: {
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      textAlign: "left",
    },

    // Stats Panel
    statsPanel: {
      gap: Spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      gap: Spacing.sm,
    },
    statCard: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      gap: Spacing.sm,
    },
    statIconBox: {
      width: 38,
      height: 38,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    statInfo: {
      flex: 1,
      alignItems: "flex-start",
    },
    statLabel: {
      fontSize: 10,
      color: Colors.textSecondary,
      fontWeight: "500",
    },
    statValue: {
      fontSize: Typography.sm,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginTop: 2,
    },

    // Overlay Styles (Update / Disabled)
    overlayContainer: {
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl * 2,
    },
    overlayContent: {
      alignItems: "center",
      width: "100%",
    },
    overlayIconBox: {
      width: 100,
      height: 100,
      borderRadius: 50,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xl,
    },
    overlayIconBoxWhite: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: "#FFF",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.xl,
    },
    overlayTitle: {
      fontSize: 24,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: Spacing.md,
    },
    overlayDesc: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      marginBottom: Spacing.xl,
    },
    overlayVersion: {
      fontSize: 16,
      fontWeight: "600",
      marginBottom: Spacing.xl,
    },
    overlayUpdateBtn: {
      backgroundColor: "#FFF",
      paddingHorizontal: 40,
      paddingVertical: 16,
      borderRadius: 30,
      ...Shadow.md,
    },
    overlayUpdateBtnText: {
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.primary,
    },
    overlayHint: {
      fontSize: 12,
      color: Colors.textTertiary,
      marginTop: Spacing.xl,
      textAlign: "center",
    },

    // Section
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 2,
      marginTop: Spacing.xs,
    },
    sectionTitle: {
      fontSize: Typography.md,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    sectionBadge: {
      backgroundColor: Colors.primaryMuted,
      borderRadius: BorderRadius.full,
      borderWidth: 1,
      borderColor: `${Colors.primary}15`,
      paddingHorizontal: Spacing.md,
      paddingVertical: 2,
    },
    sectionBadgeText: {
      color: Colors.primary,
      fontSize: Typography.xs,
      fontWeight: Typography.semibold,
    },
    modulesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "space-between",
      gap: Spacing.sm,
    },
    allDoneBox: {
      backgroundColor: Colors.primarySubtle,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: `${Colors.primary}15`,
      padding: Spacing.xl,
      alignItems: "center",
      gap: Spacing.sm,
      marginTop: Spacing.sm,
    },
    allDoneTitle: {
      fontSize: Typography.lg,
      fontWeight: Typography.semibold,
      color: Colors.primary,
      textAlign: "center",
    },
    allDoneSubtitle: {
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    brandingHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    headerLogoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.xs,
    },
    logoImageHeader: {
      width: 48,
      height: 48,
    },
    brandingText: {
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      letterSpacing: 0.5,
    },
    communityCard: {
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      marginTop: Spacing.sm,
    },
    communityHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.sm,
      marginBottom: Spacing.md,
    },
    communityTitle: {
      fontSize: Typography.sm,
      fontWeight: Typography.semibold,
      color: Colors.textSecondary,
    },
    communityRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    communityItem: {
      flex: 1,
      alignItems: "center",
    },
    communityValue: {
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.primary,
    },
    communityLabel: {
      fontSize: 10,
      color: Colors.textTertiary,
      marginTop: 2,
    },
    communityDivider: {
      width: 1,
      height: 20,
      backgroundColor: Colors.border,
      opacity: 0.5,
    },
  });
