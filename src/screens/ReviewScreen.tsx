import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Shadow, Spacing, useTheme } from "../theme";

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
  title: "تاج البر والوقار لوالديك",
  desc: "قال ﷺ: «من قرأ القرآن وعلم وعمل به أُلبس والديه يوم القيامة تاج نور».. أعظم بر تقدمه لمن ربيّاك هو أن تكون من حفظة كتاب الله.",
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
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const animatedIcon = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

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
        <Animated.View
          entering={FadeInUp.duration(1000)}
          style={styles.heroSection}
        >
          <View style={styles.heroHeader}>
            <Animated.View style={[styles.heroIconBox, animatedIcon]}>
              <Ionicons
                name="bookmark-outline"
                size={30}
                color={Colors.primary}
              />
            </Animated.View>
            <View style={styles.heroTextContent}>
              <Text style={styles.heroTitle}>فضائل حفظ الوحي</Text>
              <Text style={styles.heroSubtitle}>
                حقائق إيمانية موثقة من الكتاب والسنة حول مقام حملة القرآن الكريم
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Section: Rewards */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>أجور الآخرة والرفعة</Text>
        </View>

        {AKHIRA_VIRTUES.map((v, i) => (
          <Animated.View
            key={v.id}
            entering={FadeInDown.delay(200 + i * 150)}
            style={styles.virtueCard}
          >
            <View
              style={[styles.cardIconBox, { backgroundColor: `${v.color}10` }]}
            >
              <Ionicons name={v.icon as any} size={24} color={v.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Highlight Section for Parents */}
        <Animated.View
          entering={FadeInDown.delay(700)}
          style={styles.parentCard}
        >
          <LinearGradient
            colors={[`${Colors.primary}15`, `${Colors.background}00`]}
            style={styles.parentContent}
          >
            <Ionicons
              name={PARENT_VIRTUE.icon as any}
              size={40}
              color={PARENT_VIRTUE.color}
              style={styles.parentIcon}
            />
            <Text style={styles.parentTitle}>{PARENT_VIRTUE.title}</Text>
            <Text style={styles.parentDesc}>{PARENT_VIRTUE.desc}</Text>
          </LinearGradient>
        </Animated.View>

        {/* Section: Worldly Benefits */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>بركة القرآن في حياتك</Text>
        </View>

        {DUNYA_VIRTUES.map((v, i) => (
          <Animated.View
            key={v.id}
            entering={FadeInDown.delay(900 + i * 150)}
            style={styles.virtueCard}
          >
            <View
              style={[styles.cardIconBox, { backgroundColor: `${v.color}10` }]}
            >
              <Ionicons name={v.icon as any} size={24} color={v.color} />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{v.title}</Text>
              <Text style={styles.cardDesc}>{v.desc}</Text>
            </View>
          </Animated.View>
        ))}

        {/* Quotes Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>آثار السلف وأقوالهم</Text>
        </View>

        <View style={styles.quotesWrap}>
          {SCHOLAR_SAYINGS.map((quote, idx) => (
            <Animated.View
              key={idx}
              entering={FadeInDown.delay(1300 + idx * 200)}
              style={styles.quoteBox}
            >
              <Text style={styles.quoteText}>{quote.text}</Text>
              <View style={styles.quoteMeta}>
                <View style={styles.quoteLine} />
                <Text style={styles.quoteAuthor}>{quote.author}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Bottom Action Card */}
        <Animated.View
          entering={FadeInDown.delay(2000)}
          style={styles.actionSection}
        >
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
        </Animated.View>

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
      backgroundColor: Colors.glass,
      padding: 20,
      borderRadius: 24,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      ...Shadow.xs,
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
      fontSize: 24,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "left",
    },
    heroSubtitle: {
      fontSize: 12,
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
      fontSize: 18,
      fontWeight: "bold",
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
      ...Shadow.xs,
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
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginBottom: 6,
      textAlign: "left",
    },
    cardDesc: {
      fontSize: 13,
      color: Colors.textSecondary,
      lineHeight: 22,
      textAlign: "left",
    },

    parentCard: {
      marginVertical: 30,
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
    },
    parentIcon: {
      marginBottom: 16,
    },
    parentTitle: {
      fontSize: 22,
      fontWeight: "bold",
      color: Colors.textPrimary,
      marginBottom: 10,
      textAlign: "center",
    },
    parentDesc: {
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 22,
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
      fontSize: 15,
      color: Colors.textPrimary,
      lineHeight: 25,
      textAlign: "left",
      fontWeight: "500",
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
      fontSize: 12,
      color: Colors.textTertiary,
      fontWeight: "600",
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
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "left",
    },
    actionDesc: {
      fontSize: 12,
      color: Colors.textSecondary,
      marginTop: 4,
      textAlign: "left",
    },
  });
