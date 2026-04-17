import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MUSHAF_EDITIONS } from "../../data/mushafEditions";
import { Spacing, Typography, useTheme } from "../../theme";

interface MushafEditionPickerProps {
  currentEditionId: string;
  onSelect: (editionId: string) => void;
}

export function MushafEditionPicker({
  currentEditionId,
  onSelect,
}: MushafEditionPickerProps) {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  return (
    <View>
      {MUSHAF_EDITIONS.map((edition, idx) => {
        const isSelected = currentEditionId === edition.id;
        return (
          <React.Fragment key={edition.id}>
            <TouchableOpacity
              style={[
                styles.row,
                { alignItems: "flex-start", paddingVertical: Spacing.md },
              ]}
              onPress={() => onSelect(edition.id)}
            >
              <View style={{ flex: 1 }}>
                <View style={styles.nameRow}>
                  {isSelected && (
                    <View style={[styles.dot, { backgroundColor: Colors.primary }]} />
                  )}
                  <Text
                    style={[
                      styles.name,
                      isSelected && { color: Colors.primary, fontWeight: "bold" },
                    ]}
                  >
                    {edition.nameAr}
                  </Text>
                </View>
                <Text style={styles.desc}>{edition.description}</Text>
                <Text style={styles.meta}>
                  رواية: {edition.riwaya} • {edition.totalPages} صفحة
                </Text>
              </View>
              <Ionicons
                name={isSelected ? "radio-button-on" : "radio-button-off"}
                size={20}
                color={isSelected ? Colors.primary : Colors.textTertiary}
              />
            </TouchableOpacity>
            {idx < MUSHAF_EDITIONS.length - 1 && <View style={styles.divider} />}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    nameRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 2,
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    name: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      textAlign: "left",
    },
    desc: {
      fontFamily: Typography.body,
      fontSize: 11,
      color: Colors.textSecondary,
      textAlign: "left",
      lineHeight: 16,
    },
    meta: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.textTertiary,
      marginTop: 2,
      textAlign: "left",
    },
    divider: {
      height: 1,
      backgroundColor: Colors.border,
      marginVertical: Spacing.md,
    },
  });
