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
  const todayStr = new Date().toDateString();
  
  const dailyModuleSelections = taskSelections.filter(
    (s) => s.module === moduleInfo.id && new Date(s.createdAt).toDateString() === todayStr
  );
  
  const completedCount = dailyModuleSelections.filter((s) => s.isCompleted).length;
  const totalSelections = dailyModuleSelections.length;
  const hasSelections = totalSelections > 0;
  const completionPct = hasSelections ? completedCount / totalSelections : 0;
  
  const stats = {
    totalSelections,
    completedCount,
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(moduleInfo.id)}
      activeOpacity={0.8}
      style={styles.card}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconWrapper,
            { backgroundColor: `${moduleInfo.color}12` },
          ]}
        >
          <Ionicons
            name={moduleInfo.icon as any}
            size={22}
            color={moduleInfo.color}
          />
        </View>
        
        {/* Modern Mini Circular Indicator */}
        <View style={styles.miniRingBg}>
            <View 
                style={[
                    styles.miniRingFill, 
                    { 
                        height: `${completionPct * 100}%`, 
                        backgroundColor: completionPct === 1 ? Colors.success : moduleInfo.color 
                    }
                ]} 
            />
            {completionPct === 1 && (
                <View style={styles.doneTick}>
                    <Ionicons name="checkmark" size={8} color="#FFF" />
                </View>
            )}
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          {moduleInfo.nameAr}
        </Text>
        <Text style={styles.subtitle}>
           {moduleInfo.description}
        </Text>
      </View>

      <View style={styles.footer}>
        <View style={styles.statsTextWrap}>
            <Text style={styles.statsValue}>{stats.completedCount}/{stats.totalSelections}</Text>
            <Text style={styles.statsLabel}>مكتمل</Text>
        </View>
        <Ionicons name="chevron-back" size={12} color={Colors.textTertiary} />
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    card: {
      width: "48%",
      backgroundColor: Colors.surface,
      borderRadius: 24,
      borderWidth: 1.5,
      borderColor: Colors.border,
      padding: Spacing.lg,
      marginBottom: Spacing.md,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
    },
    miniRingBg: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: `${Colors.border}30`,
    },
    miniRingFill: {
        width: '100%',
        height: '100%',
        borderRadius: 5,
    },
    doneTick: {
        position: 'absolute',
        top: -2,
        right: -2,
        backgroundColor: Colors.success,
        borderRadius: 4,
        padding: 1,
    },
    content: { marginBottom: Spacing.md },
    title: {
      fontFamily: Typography.heading,
      fontSize: 15,
      fontWeight: 'bold',
      color: Colors.textPrimary,
      marginBottom: 2,
      textAlign: "left", // Force LTR
    },
    subtitle: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.textSecondary,
      lineHeight: 14,
      textAlign: "left", // Force LTR
    },
    footer: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingTop: Spacing.md,
      borderTopWidth: 1,
      borderTopColor: Colors.border,
    },
    statsTextWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statsValue: { fontSize: 10, fontWeight: 'bold', color: Colors.textPrimary },
    statsLabel: { fontSize: 8, color: Colors.textTertiary },
  });
