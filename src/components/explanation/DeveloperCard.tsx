import React from "react";
import { View, Text, StyleSheet, Linking, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography, Spacing, BorderRadius } from "../../theme";

interface DeveloperCardProps {
  Colors: any;
}

export const DeveloperCard: React.FC<DeveloperCardProps> = ({ Colors }) => {
  return (
    <View style={[styles.container, { backgroundColor: Colors.surfaceElevated, borderColor: Colors.border }]}>
      <View style={[styles.avatar, { backgroundColor: Colors.primarySubtle }]}>
        <Image 
          source={require("../../../assets/images/moustafa.jpg")} 
          style={styles.avatarImage} 
        />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: Colors.textPrimary }]}>م/ مصطفى أحمد</Text>
        <Text style={[styles.desc, { color: Colors.textSecondary }]}>
          مطور برمجيات يهدف من خلال هذا العمل إلى تيسير ومساعدة المسلمين في حفظ كتاب الله تعالى وإتقانه باستخدام أحدث الوسائل التقنية.
        </Text>
        <View style={styles.socials}>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: Colors.glass }]}>
            <Ionicons name="logo-linkedin" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.socialBtn, { backgroundColor: Colors.glass }]}>
            <Ionicons name="mail" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xl,
    marginBottom: Spacing["2xl"],
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  info: {
    flex: 1,
  },
  name: {
    fontFamily: Typography.heading,
    fontSize: Typography.base,
    fontWeight: "bold",
    marginBottom: 4,
  },
  desc: {
    fontFamily: Typography.body,
    fontSize: Typography.xs,
    lineHeight: 18,
    marginBottom: Spacing.sm,
  },
  socials: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  socialBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
});
