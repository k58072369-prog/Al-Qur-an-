import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";

const { width } = Dimensions.get("window");

const AKHIRA_VIRTUES = [
  {
    id: "elevation",
    title: "رفع الدرجات يوم القيامة",
    desc: "عن النبي ﷺ: «اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» (رواه مسلم). التلاوة المتواصلة للقرآن في الدنيا ترفع منزلتك في أعلى الجنان.",
    icon: "trending-up",
    color: "#8B5CF6", // Purple
  },
  {
    id: "intercession",
    title: "القرآن شفيع لك",
    desc: "قال ﷺ: «يأتي القرآن يوم القيامة شفيعاً لصاحبه» (رواه مسلم). القرآن يكون ناصرك والمحاجج عنك ويشفع لك بين يدي الله عز وجل.",
    icon: "shield-checkmark",
    color: "#10B981", // Emerald
  },
  {
    id: "companions",
    title: "مع السفرة الكرام البررة",
    desc: "قال ﷺ: «الماهر بالقرآن مع السفرة الكرام البررة» (رواه البخاري ومسلم). التمكن من التلاوة يجعلك في أعظم المنازل مع الملائكة.",
    icon: "star",
    color: "#F59E0B", // Amber
  },
];

const PARENT_VIRTUE = {
  title: "سوار الكرامة للوالدين",
  desc: "أبهى صور البر وأسمى درجات الوفاء لمن ربيّاك؛ أن تقرأ القرآن وتعمل به حتى يُلبس والديك تاجاً من نور يوم القيامة، ضياؤه يفوق ضياء الشمس.",
  icon: "ribbon",
  color: "#EC4899", // Pink
};

const DUNYA_VIRTUES = [
  {
    id: "intellect",
    title: "صفاء الذهن وقوة العقل",
    desc: "«من قرأ القرآن فحفظه وتدبره فهو أعقل الناس». حفظ الوحي يورث نوراً في العقل وقوة في الفهم لا تضاهى.",
    icon: "bulb",
    color: "#3B82F6", // Blue
  },
  {
    id: "peace",
    title: "سكينة القلب والطمأنينة",
    desc: "«ألا بذكر الله تطمئن القلوب».. القرآن هو أعظم ذكر الله، وهو الدواء الشافي للقلق والشتات النفسي.",
    icon: "heart",
    color: "#06B6D4", // Cyan
  },
];

const SCHOLAR_SAYINGS = [
  {
    text: "طلب حفظ القرآن أفضل العلوم وأساس كل علم ديني، وبغيره لا يستقيم لصاحب علم علمه.",
    author: "ابن تيمية رحمه الله",
  },
  {
    text: "القلوب أوعية، فاشغلوها بالقرآن منذ الصغر، فإنه نقش في القلب ونور لا يزول بمرور الزمان.",
    author: "ابن مسعود رضي الله عنه",
  },
];

export default function ReviewScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const [tappedIntention, setTappedIntention] = useState(false);

  const handleRenewIntention = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTappedIntention(true);
    setTimeout(() => setTappedIntention(false), 4000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Colors.background },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Creative Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconWrap}>
            <Ionicons name="sparkles" size={32} color={Colors.gold} />
          </View>
          <Text style={styles.heroTitle}>مقامات أهل القرآن</Text>
          <Text style={styles.heroSubtitle}>
            بشائر وحقائق إيمانية حول المنزلة الرفيعة لحافظ كتاب الله عز وجل في
            الدنيا والآخرة
          </Text>
        </View>

        {/* List of Akhira Virtues */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أجور الآخرة والرفعة</Text>
        </View>

        <View style={styles.virtuesContainer}>
          {AKHIRA_VIRTUES.map((v, i) => (
            <View key={v.id} style={styles.flatRow}>
              <View
                style={[styles.iconCircle, { backgroundColor: `${v.color}15` }]}
              >
                <Ionicons name={v.icon as any} size={24} color={v.color} />
              </View>
              <View style={styles.flatContent}>
                <Text style={styles.flatTitle}>{v.title}</Text>
                <Text style={styles.flatDesc}>{v.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Special Parents Highlight */}
        <View style={styles.parentFeature}>
          <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
          <View
            style={[
              styles.parentIconBadge,
              { backgroundColor: `${PARENT_VIRTUE.color}20` },
            ]}
          >
            <Ionicons
              name={PARENT_VIRTUE.icon as any}
              size={28}
              color={PARENT_VIRTUE.color}
            />
          </View>
          <View style={styles.parentTextWrap}>
            <Text style={[styles.parentTitle, { color: PARENT_VIRTUE.color }]}>
              {PARENT_VIRTUE.title}
            </Text>
            <Text style={styles.parentDesc}>{PARENT_VIRTUE.desc}</Text>
          </View>
        </View>

        {/* Dunya Virtues - Minimal Cards Row */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>بركة القرآن في دنياك</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {DUNYA_VIRTUES.map((v) => (
            <View key={v.id} style={styles.miniCard}>
              <View
                style={[styles.miniIcon, { backgroundColor: `${v.color}15` }]}
              >
                <Ionicons name={v.icon as any} size={22} color={v.color} />
              </View>
              <Text style={styles.miniTitle}>{v.title}</Text>
              <Text style={styles.miniDesc}>{v.desc}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Quotes Section */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>آثار السلف وأقوالهم</Text>
        </View>

        <View style={styles.quotesWrap}>
          {SCHOLAR_SAYINGS.map((quote, idx) => (
            <View key={idx} style={styles.quoteRow}>
              <Ionicons
                name="chatbubbles"
                size={24}
                color={`${Colors.primary}40`}
                style={styles.quoteIcon}
              />
              <View style={styles.quoteContent}>
                <Text style={styles.quoteText}>{quote.text}</Text>
                <Text style={styles.quoteAuthor}>— {quote.author}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Intention Action */}
        <TouchableOpacity
          style={[
            styles.intentionBtn,
            tappedIntention && {
              backgroundColor: `${Colors.success}15`,
              borderColor: Colors.success,
            },
          ]}
          onPress={handleRenewIntention}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.intentionIcon,
              tappedIntention
                ? { backgroundColor: Colors.success }
                : { backgroundColor: Colors.primary },
            ]}
          >
            <Ionicons
              name={tappedIntention ? "checkmark" : "leaf"}
              size={20}
              color="#FFF"
            />
          </View>
          <View style={styles.intentionTextWrap}>
            <Text
              style={[
                styles.intentionTitle,
                tappedIntention && { color: Colors.success },
              ]}
            >
              {tappedIntention
                ? "تم تجديد النية لله"
                : "تجديد النية لكتاب الله"}
            </Text>
            <Text style={styles.intentionDesc}>
              {tappedIntention
                ? "تقبل الله منك، سدد الله خطاك."
                : "اضغط هنا لتذكر نفسك بالإخلاص في حفظك."}
            </Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingBottom: 40 },

    heroSection: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 80,
      paddingBottom: Spacing.xl,
      alignItems: "center",
      justifyContent: "center",
    },
    heroIconWrap: {
      width: 64,
      height: 64,
      borderRadius: 20,
      backgroundColor: `${Colors.gold}15`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    heroTitle: {
      fontFamily: Typography.heading,
      fontSize: 26,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: Spacing.sm,
    },
    heroSubtitle: {
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: Spacing.md,
    },

    sectionHeader: {
      paddingHorizontal: Spacing.xl,
      marginBottom: Spacing.md,
      marginTop: Spacing.lg,
    },
    sectionTitle: {
      fontFamily: Typography.heading,
      fontSize: 18,
      fontWeight: Typography.bold,
      color: Colors.primary,
      textAlign: "left",
    },

    virtuesContainer: {
      paddingHorizontal: Spacing.xl,
    },
    flatRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.borderLight,
    },
    iconCircle: {
      width: 50,
      height: 50,
      borderRadius: 25,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    flatContent: {
      flex: 1,
      alignItems: "flex-start",
    },
    flatTitle: {
      fontFamily: Typography.heading,
      fontSize: 16,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 4,
      textAlign: "left",
      width: "100%",
    },
    flatDesc: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 22,
      textAlign: "left",
      width: "100%",
    },

    parentFeature: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xl,
      marginBottom: Spacing.md,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      flexDirection: "row",
      alignItems: "center",
      overflow: "hidden",
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      backgroundColor: Colors.glass,
    },
    glassOverlay: {
      backgroundColor: Colors.glass,
      opacity: 0.5,
    },
    parentIconBadge: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    parentTextWrap: {
      flex: 1,
      alignItems: "flex-start",
    },
    parentTitle: {
      fontFamily: Typography.heading,
      fontSize: 17,
      fontWeight: Typography.bold,
      marginBottom: 4,
      textAlign: "left",
      width: "100%",
    },
    parentDesc: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 20,
      textAlign: "left",
    },

    horizontalScroll: {
      paddingHorizontal: Spacing.xl,
      gap: Spacing.md,
      flexDirection: "row",
    },
    miniCard: {
      width: width * 0.7,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      alignItems: "flex-start",
    },
    miniIcon: {
      width: 44,
      height: 44,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.md,
    },
    miniTitle: {
      fontFamily: Typography.heading,
      fontSize: 15,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 6,
      textAlign: "left",
      width: "100%",
    },
    miniDesc: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 20,
      textAlign: "left",
      width: "100%",
    },

    quotesWrap: {
      paddingHorizontal: Spacing.xl,
      marginTop: Spacing.sm,
    },
    quoteRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: Spacing.lg,
      backgroundColor: Colors.surface,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    quoteIcon: {
      marginRight: Spacing.sm,
      marginTop: 2,
    },
    quoteContent: {
      flex: 1,
    },
    quoteText: {
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textPrimary,
      lineHeight: 24,
      textAlign: "left",
    },
    quoteAuthor: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.primary,
      marginTop: 8,
      textAlign: "left",
      fontWeight: "bold",
    },

    intentionBtn: {
      marginHorizontal: Spacing.xl,
      marginTop: Spacing.xl,
      padding: Spacing.lg,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: `${Colors.primary}30`,
      backgroundColor: Colors.glass,
      flexDirection: "row",
      alignItems: "center",
    },
    intentionIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: "center",
      justifyContent: "center",
      marginRight: Spacing.md,
    },
    intentionTextWrap: {
      flex: 1,
    },
    intentionTitle: {
      fontFamily: Typography.heading,
      fontSize: 16,
      fontWeight: Typography.bold,
      color: Colors.primary,
      textAlign: "left",
      marginBottom: 2,
    },
    intentionDesc: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "left",
    },
  });
