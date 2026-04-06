import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
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
import { Shadow, Spacing, useTheme, Typography } from "../theme";

const { width } = Dimensions.get("window");

const AKHIRA_VIRTUES = [
  {
    id: "elevation",
    title: "رفع الدرجات يوم القيامة",
    desc: "عن النبي ﷺ: «اقرؤوا القرآن فإنه يأتي يوم القيامة شفيعاً لأصحابه» (رواه مسلم). التلاوة المتواصلة للقرآن في الدنيا ترفع منزلتك في أعلى الجنان.",
    icon: "trending-up-outline",
    color: "#6366F1",
  },
  {
    id: "intercession",
    title: "شفاعة القرآن لأصحابه",
    desc: "قال ﷺ: «يأتي القرآن يوم القيامة شفيعاً لصاحبه» (رواه مسلم). القرآن يكون ناصرك والمحاجج عنك ويشفع لك بين يدي الله عز وجل.",
    icon: "shield-half-outline",
    color: "#10B981",
  },
  {
    id: "companions",
    title: "مع السفرة الكرام البررة",
    desc: "قال ﷺ: «الماهر بالقرآن مع السفرة الكرام البررة» (رواه البخاري ومسلم). التمكن من تلاوة كتاب الله وحفظه يجعلك في أعظم المنازل مع الملائكة.",
    icon: "star-outline",
    color: "#8B5CF6",
  },
];

const PARENT_VIRTUE = {
  title: "سوار الكرامة وشرف الوالدين",
  desc: "أبهى صور البر وأسمى درجات الوفاء لمن ربيّاك؛ أن تقرأ القرآن وتعمل به حتى يُلبس والديك تاجاً من نور يوم القيامة، ضياؤه يفوق ضياء الشمس.",
  icon: "ribbon-outline",
  color: "#F59E0B",
};

const DUNYA_VIRTUES = [
  {
    id: "intellect",
    title: "صفاء الذهن وقوة العقل",
    desc: "عن عبد الله بن مسعود رضي الله عنه: «من قرأ القرآن فحفظه وتدبره فهو أعقل الناس». حفظ الوحي يورث نوراً في العقل وقوة في الفهم.",
    icon: "flash-outline",
    color: "#3B82F6",
  },
  {
    id: "peace",
    title: "سكينة القلب وطمأنينة النفس",
    desc: "قال تعالى: «ألا بذكر الله تطمئن القلوب».. القرآن هو أعظم ذكر الله، وهو الدواء الوحيد للقلق والشتات النفسي في هذا العصر.",
    icon: "heart-outline",
    color: "#EC4899",
  },
  {
    id: "barakah",
    title: "بركة العلم وتيسير العمل",
    desc: "قال ﷺ: «خيركم من تعلم القرآن وعلمه». الانشغال بالقرآن يبارك لك في حياتك ووقتك ويفتح لك أبواب الخير والرزق من حيث لا تحتسب.",
    icon: "leaf-outline",
    color: "#22C55E",
  },
];

const SCHOLAR_SAYINGS = [
  {
    text: "طلب حفظ القرآن أفضل العلوم وأساس كل علم ديني، وبغيره لا يستقيم لصاحب علم علمه.",
    author: "ابن تيمية رحمه الله",
  },
  {
    text: "القلوب أوعية، فاشغلوها بالقرآن منذ الصغر، فإنه نقش في القلب ونور لا يزول بمرور الزمان.",
    author: "عبد الله بن مسعود رضي الله عنه",
  },
  {
    text: "من داوم على القرآن لم يرد إلى أرذل العمر، ويمتاز بحضور الذهن وسهولة البيان ما دام حياً.",
    author: "الإمام عكرمة رحمه الله",
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
      <LinearGradient
        colors={[Colors.background, Colors.surface]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Modern Minimal Header */}
        <View style={styles.heroSection}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIconBox}>
              <Ionicons
                name="bookmark-outline"
                size={30}
                color={Colors.primary}
              />
            </View>
            <View style={styles.heroTextContent}>
              <Text style={styles.heroTitle}>مقامات حملة القرآن الكريم</Text>
              <Text style={styles.heroSubtitle}>
                بشائر وحقائق إيمانية حول المنزلة الرفيعة لحافظ كتاب الله عز وجل
              </Text>
            </View>
          </View>
        </View>

        {/* Section: Rewards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أجور الآخرة والرفعة</Text>
        </View>

        {AKHIRA_VIRTUES.map((v, i) => (
          <View key={v.id} style={styles.virtueCard}>
            <View
              style={[styles.cardIconBox, { backgroundColor: `${v.color}10` }]}
            >
              <Ionicons name={v.icon as any} size={24} color={v.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
          </View>
        ))}

        {/* Highlight Section for Parents */}
        <View style={styles.parentCard}>
          <LinearGradient
            colors={[`${Colors.primary}10`, `${Colors.background}`]}
            style={styles.parentContent}
          >
            <View style={styles.parentIconBadge}>
              <Ionicons
                name={PARENT_VIRTUE.icon as any}
                size={34}
                color={PARENT_VIRTUE.color}
              />
            </View>
            <Text style={styles.parentTitle}>{PARENT_VIRTUE.title}</Text>
            <Text style={styles.parentDesc}>{PARENT_VIRTUE.desc}</Text>
          </LinearGradient>
        </View>

        {/* Section: Worldly Benefits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>بركة القرآن في حياتك</Text>
        </View>

        {DUNYA_VIRTUES.map((v, idx) => (
          <View key={v.id} style={styles.virtueCard}>
            <View
              style={[styles.cardIconBox, { backgroundColor: `${v.color}10` }]}
            >
              <Ionicons name={v.icon as any} size={24} color={v.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
          </View>
        ))}

        {/* Quotes Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>آثار السلف وأقوالهم</Text>
        </View>

        <View style={styles.quotesWrap}>
          {SCHOLAR_SAYINGS.map((quote, idx) => (
            <View key={idx} style={styles.quoteBox}>
              <Text style={styles.quoteText}>{quote.text}</Text>
              <View style={styles.quoteMeta}>
                <View style={styles.quoteLine} />
                <Text style={styles.quoteAuthor}>{quote.author}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bottom Action Card */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[
              styles.actionButton,
              tappedIntention && { borderColor: Colors.success },
            ]}
            onPress={handleRenewIntention}
            activeOpacity={0.8}
          >
            <View style={styles.actionInner}>
              <Ionicons
                name={
                  tappedIntention
                    ? "checkmark-circle"
                    : "refresh-circle-outline"
                }
                size={34}
                color={tappedIntention ? Colors.success : Colors.primary}
              />
              <View style={styles.actionTextWrap}>
                <Text
                  style={[
                    styles.actionTitle,
                    tappedIntention && { color: Colors.success },
                  ]}
                >
                  {tappedIntention
                    ? "تم تجديد النية لله"
                    : "تحديد النية والإخلاص"}
                </Text>
                <Text style={styles.actionDesc}>
                  {tappedIntention
                    ? "جزاك الله خيراً، استمر على هذا الطريق."
                    : "اضغط هنا لتذكر نفسك بالإخلاص في حفظك."}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    scrollContent: { paddingBottom: 60 },

    heroSection: {
      paddingHorizontal: Spacing.xl,
      paddingTop: 70,
      marginBottom: 30,
    },
    heroHeader: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: Colors.surface,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      ...Shadow.sm,
    },
    heroIconBox: {
      width: 56,
      height: 56,
      borderRadius: 20,
      backgroundColor: `${Colors.primary}08`,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    heroTextContent: { flex: 1, alignItems: "flex-start" },
    heroTitle: {
      fontFamily: Typography.heading, fontSize: 24,
      color: Colors.textPrimary,
      textAlign: "left",
    },
    heroSubtitle: {
      fontFamily: Typography.body, fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 4,
      lineHeight: 18,
      textAlign: "left",
    },

    sectionHeader: {
      paddingHorizontal: Spacing.xl,
      marginBottom: 16,
      marginTop: 10,
    },
    sectionTitle: {
      fontFamily: Typography.heading, fontSize: 18,
      color: Colors.textPrimary,
      borderLeftWidth: 3,
      borderLeftColor: Colors.primary,
      paddingLeft: 10,
      textAlign: "left",
    },

    virtueCard: {
      marginHorizontal: Spacing.xl,
      backgroundColor: Colors.surface,
      borderRadius: 20,
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.borderLight,
      marginBottom: 12,
      ...Shadow.sm,
    },
    cardIconBox: {
      width: 48,
      height: 48,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 16,
    },
    cardContent: { flex: 1, alignItems: "flex-start" },
    cardTitle: {
      fontFamily: Typography.heading, fontSize: 16,
      color: Colors.textPrimary,
      marginBottom: 6,
      textAlign: "left",
    },
    cardDesc: {
      fontFamily: Typography.body, fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 22,
      textAlign: "left",
    },

    parentCard: {
      marginVertical: 20,
      marginHorizontal: Spacing.xl,
      borderRadius: 24,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.borderLight,
      overflow: "hidden",
      ...Shadow.sm,
    },
    parentContent: {
      padding: 24,
      alignItems: "center",
      justifyContent: "center",
    },
    parentIconBadge: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: `${PARENT_VIRTUE.color}10`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 16,
    },
    parentTitle: {
      fontFamily: Typography.heading, fontSize: 20,
      color: Colors.textPrimary,
      marginBottom: 10,
      textAlign: "center",
    },
    parentDesc: {
      fontFamily: Typography.body, fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
      paddingHorizontal: 10,
    },

    quotesWrap: {
      paddingHorizontal: Spacing.xl,
      gap: 16,
    },
    quoteBox: {
      backgroundColor: Colors.glass,
      padding: 20,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
    quoteText: {
      fontFamily: Typography.body, fontSize: 15,
      color: Colors.textPrimary,
      lineHeight: 25,
      textAlign: "left",
    },
    quoteMeta: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-start",
      marginTop: 12,
      gap: 8,
    },
    quoteLine: {
      width: 14,
      height: 1,
      backgroundColor: Colors.textTertiary,
    },
    quoteAuthor: {
      fontFamily: Typography.heading, fontSize: 12,
      color: Colors.textTertiary,
      textAlign: "left",
    },

    actionSection: {
      marginTop: 40,
      paddingHorizontal: Spacing.xl,
    },
    actionButton: {
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.border,
      backgroundColor: Colors.surface,
      overflow: "hidden",
    },
    actionInner: {
      padding: 20,
      flexDirection: "row",
      alignItems: "center",
    },
    actionTextWrap: {
      flex: 1,
      marginLeft: 16,
      alignItems: "flex-start",
    },
    actionTitle: {
      fontFamily: Typography.heading, fontSize: 18,
      color: Colors.textPrimary,
      textAlign: "left",
    },
    actionDesc: {
      fontFamily: Typography.body, fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 4,
      textAlign: "left",
    },
  });
