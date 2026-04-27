import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Animated,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Spacing, Typography } from "../../theme";
import { getMotivationalMessage } from "../../utils/helpers";

interface DashboardHeaderProps {
  user: any;
  fadeAnim: Animated.Value;
  slideAnim: Animated.Value;
  Colors: any;
}

export function DashboardHeader({
  user,
  fadeAnim,
  slideAnim,
  Colors,
}: DashboardHeaderProps) {
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);
  const hours = new Date().getHours();
  const greeting =
    hours < 12 ? "صباح النور" : hours < 17 ? "مساء الخير" : "طابت ليلتك";

  return (
    <Animated.View
      style={[
        styles.header,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <View style={styles.topRow}>
        <View style={{ width: 50 }} />
        <View style={styles.brandBlock}>
          <Image
            source={require("../../../assets/images/motqn_logo.png")}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          {/* Dedication card — shown clearly as ongoing charity for the developer's late father */}
          <View style={styles.dedicationCard}>
            <View style={styles.dedicationDivider} />
            <Text style={styles.dedicationLabel}>صدقة جارية</Text>
            <Text style={styles.dedicationText}>
              على روح والدي{"\n"}المهندس أيمن مبروك ريان
            </Text>
            <Text style={styles.dedicationDua}>تقبّل الله منه ورحمه</Text>
          </View>
        </View>
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
          <Text style={styles.greetingText}>{greeting}،</Text>
          <Text style={styles.userName}>{user?.name ?? "يا حامل القرآن"}</Text>
        </View>
        <View style={styles.xpBadge}>
          <Ionicons name="sparkles" size={12} color={Colors.gold} />
          <Text style={styles.xpBadgeText}>{user?.totalXP ?? 0} نقطة</Text>
        </View>
      </View>

      <View style={styles.quoteCard}>
        <View style={styles.quoteLine} />
        <View style={styles.quoteContent}>
          <Ionicons
            name="chatbox-ellipses-outline"
            size={14}
            color={Colors.textTertiary}
            style={{ marginBottom: 4 }}
          />
          <Text style={styles.quoteText}>{getMotivationalMessage()}</Text>
        </View>
      </View>
    </Animated.View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    header: { marginBottom: Spacing.sm },
    topRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.lg,
    },
    headerLogo: { width: 110, height: 110 },
    brandBlock: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
    },
    dedicationCard: {
      marginTop: 8,
      paddingVertical: 10,
      paddingHorizontal: 16,
      borderRadius: 14,
      backgroundColor: `${Colors.gold}10`,
      borderWidth: 1,
      borderColor: `${Colors.gold}30`,
      alignItems: "center",
      maxWidth: 260,
    },
    dedicationDivider: {
      width: 28,
      height: 2,
      backgroundColor: Colors.gold,
      borderRadius: 2,
      opacity: 0.6,
      marginBottom: 6,
    },
    dedicationLabel: {
      fontFamily: Typography.heading,
      fontSize: 11,
      fontWeight: "800",
      letterSpacing: 1.5,
      color: Colors.gold,
      marginBottom: 4,
    },
    dedicationText: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textPrimary,
      textAlign: "center",
      lineHeight: 18,
    },
    dedicationDua: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.gold,
      marginTop: 4,
      opacity: 0.85,
    },
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
    },
    xpBadge: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: `${Colors.gold}15`,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      gap: 6,
      marginBottom: 4,
    },
    xpBadgeText: { fontSize: 12, fontWeight: "bold", color: Colors.gold },
    quoteCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 12,
      paddingVertical: Spacing.md,
      paddingRight: Spacing.xl,
    },
    quoteLine: {
      width: 3,
      height: "100%",
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    quoteContent: { flex: 1 },
    quoteText: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 20,
    },
  });
