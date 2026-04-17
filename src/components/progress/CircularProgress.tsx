import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Typography } from "../../theme";

const STROKE_WIDTH = 12;

interface CircularProgressProps {
  percentage: number;
  color: string;
  size: number;
  Colors: any;
  label?: string;
}

export const CircularProgress = ({
  percentage,
  color,
  size,
  Colors,
  label = "إتمام الحفظ",
}: CircularProgressProps) => {
  const pct = Math.max(0, Math.min(1, percentage));
  const innerSize = size - STROKE_WIDTH * 2;

  const getRotation = (p: number) => `${p * 180 - 180}deg`;

  const rightHalfPct = pct <= 0.5 ? pct * 2 : 1;
  const leftHalfPct = pct > 0.5 ? (pct - 0.5) * 2 : 0;

  return (
    <View style={{ width: size, height: size, justifyContent: "center", alignItems: "center" }}>
      {/* Background Track Ring */}
      <View style={[styles.ring, { width: size, height: size, borderRadius: size / 2, borderColor: Colors.border }]} />

      {/* Right Half Container */}
      <View style={[styles.halfContainer, { width: size, height: size, flexDirection: "row-reverse" }]}>
        <View style={{ width: size / 2, height: size, overflow: "hidden" }}>
          <View
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderRightColor: color,
                borderTopColor: color,
                transform: [{ rotate: "-45deg" }, { rotate: getRotation(rightHalfPct) }],
                right: 0,
              },
            ]}
          />
        </View>
      </View>

      {/* Left Half Container */}
      <View style={[styles.halfContainer, { width: size, height: size, flexDirection: "row" }]}>
        <View style={{ width: size / 2, height: size, overflow: "hidden" }}>
          <View
            style={[
              styles.ring,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderLeftColor: leftHalfPct > 0 ? color : "transparent",
                borderBottomColor: leftHalfPct > 0 ? color : "transparent",
                transform: [{ rotate: "-45deg" }, { rotate: getRotation(leftHalfPct) }],
                left: 0,
              },
            ]}
          />
        </View>
      </View>

      {/* Center Background & Text */}
      <View
        style={{
          width: innerSize + 2,
          height: innerSize + 2,
          borderRadius: (innerSize + 2) / 2,
          backgroundColor: Colors.surface,
          justifyContent: "center",
          alignItems: "center",
          zIndex: 10,
        }}
      >
        <Text style={[styles.pctText, { color: Colors.textPrimary }]}>
          {Math.round(pct * 100)}%
        </Text>
        <Text style={[styles.label, { color: Colors.textSecondary }]}>
          {label}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    position: "absolute",
    borderWidth: STROKE_WIDTH,
    borderColor: "transparent",
  },
  halfContainer: {
    position: "absolute",
  },
  pctText: {
    fontFamily: Typography.heading,
    fontSize: 32,
    fontWeight: "bold",
  },
  label: {
    fontFamily: Typography.body,
    fontSize: 12,
    marginTop: 2,
  },
});
