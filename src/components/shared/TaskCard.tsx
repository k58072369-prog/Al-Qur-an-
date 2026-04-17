import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { RangeChip } from "./RangeChip";
import { BorderRadius, Shadow, Spacing, Typography } from "../../theme";
import { TaskSelection } from "../../types";

interface TaskCardProps {
  task: TaskSelection;
  moduleColor: string;
  isListeningModule: boolean;
  onRemove: (id: string) => void;
  onComplete: (task: TaskSelection) => void;
  onStartSession: (task: TaskSelection) => void;
  Colors: any;
}

export function TaskCard({
  task,
  moduleColor,
  isListeningModule,
  onRemove,
  onComplete,
  onStartSession,
  Colors,
}: TaskCardProps) {
  return (
    <View style={[styles.taskCard, { backgroundColor: Colors.surface, borderColor: Colors.glass }]}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskDate, { color: Colors.textTertiary }]}>
          أُضيف في: {new Date(task.createdAt).toLocaleDateString("ar-EG")}
        </Text>
        <TouchableOpacity onPress={() => onRemove(task.id)}>
          <Ionicons name="trash-outline" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      <View style={styles.rangesContainer}>
        {task.ranges.map((r, i) => (
          <RangeChip key={i} range={r} onRemove={() => {}} />
        ))}
      </View>

      <TouchableOpacity
        style={[styles.completeBtn, { backgroundColor: `${moduleColor}15` }]}
        onPress={() => onComplete(task)}
      >
        <Ionicons name="checkmark-circle" size={20} color={moduleColor} />
        <Text style={[styles.completeBtnText, { color: moduleColor }]}>تحديد كمنجز</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.startBtn, { borderColor: `${moduleColor}30` }]}
        onPress={() => onStartSession(task)}
      >
        <Ionicons
          name={isListeningModule ? "headset-outline" : "timer-outline"}
          size={18}
          color={moduleColor}
        />
        <Text style={[styles.startBtnText, { color: moduleColor }]}>
          {isListeningModule ? "استماع لورد اليوم (الشيخ الحصري)" : "بدء الجلسة المؤقتة"}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  taskHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    paddingBottom: Spacing.sm,
  },
  taskDate: {
    fontFamily: Typography.body,
    fontSize: Typography.xs,
  },
  rangesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  completeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  completeBtnText: {
    fontFamily: Typography.heading,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
    borderWidth: 1,
    marginTop: Spacing.xs,
  },
  startBtnText: {
    fontFamily: Typography.body,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
});
