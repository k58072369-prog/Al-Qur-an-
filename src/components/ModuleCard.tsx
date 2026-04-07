import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSelectionStore } from "../store/selectionStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";
import { ModuleInfo } from "../types";

const { width } = Dimensions.get("window");

type ModuleCardProps = {
  moduleInfo: ModuleInfo;
  onPress: (id: string) => void;
};

export function ModuleCard({ moduleInfo, onPress }: ModuleCardProps) {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const taskSelections = useSelectionStore((state) => state.taskSelections);
  const getModuleStats = useSelectionStore((state) => state.getModuleStats);
  const stats = getModuleStats(moduleInfo.id);
  const hasSelections = stats.totalSelections > 0;

  return (
    <TouchableOpacity
      onPress={() => onPress(moduleInfo.id)}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.gradient}>
        <View style={styles.header}>
          <View
            style={[
              styles.iconWrapper,
              { backgroundColor: `${moduleInfo.color}15` },
            ]}
          >
            <Ionicons
              name={moduleInfo.icon as any}
              size={24}
              color={moduleInfo.color}
            />
          </View>
          {hasSelections && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {stats.completedCount}/{stats.totalSelections}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={1}>
            {moduleInfo.nameAr}
          </Text>
          <Text style={styles.subtitle}>{moduleInfo.description}</Text>
        </View>

        <View style={styles.footer}>
          {stats.lastActivity ? (
            <View style={styles.metaRow}>
              <Ionicons
                name="time-outline"
                size={12}
                color={Colors.textTertiary}
              />
              <Text style={styles.metaText}>
                النشاط الأخير:{" "}
                {new Date(stats.lastActivity).toLocaleDateString("ar-EG", {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          ) : (
            <View style={styles.metaRow}>
              <Text
                style={[
                  styles.metaText,
                  { color: Colors.textTertiary, fontStyle: "italic" },
                ]}
              >
                لم يتم إضافة أوراد بعد
              </Text>
            </View>
          )}

          <Ionicons name="chevron-back" size={16} color={Colors.textTertiary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    card: {
      width: "48%", // Flexible grid item width
      marginBottom: Spacing.md,
      borderRadius: 20, 
      backgroundColor: Colors.glass, 
      overflow: "hidden", 
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      // Zero shadow as requested, matching the explanation button style
    },
    gradient: {
      flex: 1,
      padding: Spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: Spacing.md,
    },
    iconWrapper: {
      width: 44,
      height: 44,
      borderRadius: BorderRadius.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    badge: {
      backgroundColor: Colors.primaryMuted,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: BorderRadius.sm,
      borderWidth: 0.5,
      borderColor: `${Colors.primary}30`,
    },
    badgeText: {
      fontFamily: Typography.heading,
      fontSize: 10,
      color: Colors.primary,
    },
    content: {
      flex: 1,
      marginBottom: Spacing.md,
    },
    title: {
      fontFamily: Typography.heading,
      fontSize: Typography.base,
      color: Colors.textPrimary,
      marginBottom: 2,
      textAlign: "left",
    },
    subtitle: {
      fontFamily: Typography.body,
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      lineHeight: Typography.xs * 1.5,
      textAlign: "left",
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      borderTopWidth: 1,
      borderTopColor: Colors.glassBorder,
      paddingTop: Spacing.md,
      marginTop: 2,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
    },
    metaText: {
      fontFamily: Typography.body,
      fontSize: 8,
      color: Colors.textTertiary,
    },
  });
