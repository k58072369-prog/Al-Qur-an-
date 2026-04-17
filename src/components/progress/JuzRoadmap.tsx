import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Spacing } from "../../theme";

interface JuzProgressItem {
  id: number;
  pct: number;
}

interface JuzRoadmapProps {
  juzProgress: JuzProgressItem[];
  Colors: any;
}

export function JuzRoadmap({ juzProgress, Colors }: JuzRoadmapProps) {
  return (
    <View style={styles.roadmapContainer}>
      {juzProgress.map((j, index) => (
        <View key={j.id} style={styles.roadmapNode}>
          {/* Connection Line */}
          {index < juzProgress.length - 1 && (
            <View
              style={[
                styles.roadmapLine,
                { backgroundColor: j.pct >= 1 ? Colors.success : Colors.border },
              ]}
            />
          )}

          {/* Milestone Node */}
          <View
            style={[
              styles.milestoneIcon,
              j.pct >= 1 ? styles.milestoneDone : j.pct > 0 ? styles.milestoneActive : styles.milestoneEmpty,
              { borderColor: j.pct > 0 ? Colors.primary : Colors.border }
            ]}
          >
            <Text style={[styles.milestoneNum, { color: j.pct >= 1 ? '#FFF' : Colors.textPrimary }]}>{j.id}</Text>
            {j.pct >= 1 && <Ionicons name="checkmark" size={12} color="#FFF" style={styles.nodeCheck} />}
          </View>

          {/* Progress Details */}
          <View style={styles.nodeContent}>
            <Text style={styles.nodeTitle}>الجزء {j.id}</Text>
            <View style={styles.nodeProgressTrack}>
              <View style={[styles.nodeProgressFill, { width: `${j.pct * 100}%`, backgroundColor: j.pct >= 1 ? Colors.success : Colors.primary }]} />
            </View>
            <Text style={styles.nodeStat}>{Math.round(j.pct * 100)}% متمم</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  roadmapContainer: { paddingLeft: 10, marginTop: Spacing.md },
  roadmapNode: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 30, position: 'relative' },
  roadmapLine: { position: 'absolute', left: 20, top: 40, width: 2, height: 30, zIndex: 0 },
  milestoneIcon: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'transparent', borderWidth: 2, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  milestoneDone: { backgroundColor: '#4CAF50', borderColor: '#4CAF50' },
  milestoneActive: { backgroundColor: 'transparent' },
  milestoneEmpty: { opacity: 0.8 },
  milestoneNum: { fontSize: 14, fontWeight: 'bold' },
  nodeCheck: { position: 'absolute', bottom: -2, right: -2, backgroundColor: '#4CAF50', borderRadius: 8, padding: 1, borderWidth: 1, borderColor: '#FFF' },
  nodeContent: { flex: 1, marginLeft: Spacing.lg, paddingTop: 4 },
  nodeTitle: { fontSize: 15, fontWeight: 'bold', textAlign: 'left' },
  nodeProgressTrack: { height: 6, backgroundColor: '#E0E0E0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  nodeProgressFill: { height: '100%' },
  nodeStat: { fontSize: 11, color: '#757575', marginTop: 4, textAlign: 'left' },
});
