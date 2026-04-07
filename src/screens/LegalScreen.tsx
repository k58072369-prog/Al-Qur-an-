import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";

export default function LegalScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const BulletPoint = ({ text }: { text: string }) => (
    <View style={styles.bulletRow}>
      <View style={styles.bullet} />
      <Text style={styles.bulletText}>{text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: Colors.background },
        ]}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>الشروط والخصوصية</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            شروط وأحكام الاستخدام (Terms of Service)
          </Text>
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraph}>
              يُعد استخدامك لتطبيق "خماسية الحفظ" بمثابة موافقة صريحة على الشروط
              والأحكام التالية. يرجى قراءتها بعناية قبل البدء:
            </Text>
          </View>
          <BulletPoint text="١. الغرض من التطبيق: تم تطوير هذا التطبيق ليكون أداة مساعدة تقنية ومنهجية لطلاب القرآن الكريم لتنظيم خطط الحفظ والمراجعة وفق نظام خماسية الحفظ." />
          <BulletPoint text="٢. الملكية الفكرية: جميع حقوق البرمجية، التصاميم، والشعارات خاصة بمطور التطبيق. يُمنع نسخ أو تعديل أو إعادة توزيع البرمجية لأغراض تجارية دون إذن كتابي." />
          <BulletPoint text="٣. دقة البيانات: نحن نبذل قصارى جهدنا لضمان دقة نصوص القرآن الكريم والمعلومات المنهجية، ومع ذلك فإننا نسألك دائماً مراجعة حفظك على مشايخك المعتمدين، فالتطبيق وسيلة مساعدة وليس بديلاً عن التلقي والمشافهة." />
          <BulletPoint text="٤. إخلاء المسؤولية: يتم توفير التطبيق 'كما هو' دون أي ضمانات صريحة أو ضمنية. المطور غير مسؤول عن أي فقدان للبيانات المخزنة محلياً نتيجة مسح التطبيق أو تعطل الجهاز." />
          <BulletPoint text="٥. التحديثات: يحق لنا تحديث التطبيق أو تغيير خصائصه في أي وقت لتحسين تجربة المستخدم أو إصلاح المشكلات التقنية." />
        </View>

        <View style={[styles.card, { marginTop: Spacing.xl }]}>
          <Text style={styles.sectionTitle}>
            سياسة الخصوصية وحماية البيانات (Privacy Policy)
          </Text>
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraph}>
              خصوصيتك هي أولويتنا القصوى، لذا قمنا بتصميم التطبيق ليعمل بأقصى
              درجات الأمان والخصوصية وفقاً لمعايير المتاجر العالمية (Google Play
              & App Store):
            </Text>
          </View>
          <BulletPoint text="١. عدم جمع البيانات الشخصية: نحن لا نطلب منك إدخال اسمك الحقيقي، بريدك الإلكتروني، رقم هاتفك، أو أي بيانات تدل على هويتك الشخصية عند بدء الاستخدام." />
          <BulletPoint text="٢. المعالجة المحلية (Offline Processing): جميع بيانات تقدمك في الحفظ، خططك اليومية، وإحصائياتك تُخزن 'محلياً' على ذاكرة جهازك فقط (AsyncStorage). لا يتم إرسال هذه البيانات إلى أي خوادم خارجية أو قواعد بيانات سحابية." />
          <BulletPoint text="٣. الشفافية تجاه الأطراف الثالثة: التطبيق لا يحتوي على أدوات تتبع (Trackers) مثل Google Analytics أو Facebook SDK، ولا يتم مشاركة أي معلومات مع طرف ثالث لأغراض إعلانية أو إحصائية." />
          <BulletPoint text="٤. الصلاحيات والأذونات: يطلب التطبيق إذن 'الإشعارات' فقط لتذكيرك بأورادك اليومية، وإذن 'الاهتزاز' (Haptics) لتحسين التفاعل اللمسي. كلا الإذنين اختياريان ويمكنك إلغاؤهما من الإعدادات في أي وقت." />
          <BulletPoint text="٥. حماية القصر (Children's Privacy): تطبيقنا آمن تماماً للأطفال (COPPA Compliant)؛ حيث لا يطلب أي معلومات، ولا يحتوي على إعلانات، ولا يوجه المستخدمين لمواقع خارجية غير آمنة." />
          <BulletPoint text="٦. حذف البيانات: يمكنك حذف المسار بالكامل وجميع بياناتك المخزنة ببساطة من خلال زر 'مسح البيانات' في إعدادات التطبيق أو من خلال حذف التطبيق من جهازك." />
        </View>

        <View
          style={[
            styles.card,
            { marginTop: Spacing.xl, marginBottom: Spacing["3xl"] },
          ]}
        >
          <Text style={styles.sectionTitle}>التواصل الرسمي والدعم</Text>
          <View style={styles.paragraphContainer}>
            <Text style={styles.paragraph}>
              بصفتنا المطورين الرسميين لهذا العمل، نسعد بتلقي ملاحظاتكم أو
              بلاغات الأخطاء لضمان استمرار تقديم الأفضل لخدمة كتاب الله:
            </Text>
          </View>
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>
              mustafa.ahmad.work@gmail.com
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 56,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.md,
    },
    headerTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.lg,
      fontWeight: Typography.semibold,
      color: Colors.textPrimary,
    },
    backBtn: {
      width: 40,
      height: 40,
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.md,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.md,
      paddingBottom: Spacing["5xl"],
    },
    card: {
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.lg,
      padding: Spacing.lg,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
    sectionTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.primary,
      marginBottom: Spacing.md,
      textAlign: "left",
    },
    paragraphContainer: {
      marginBottom: Spacing.md,
    },
    paragraph: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textPrimary,
      lineHeight: Typography.sm * 1.6,
      textAlign: "left",
    },
    bulletRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      marginBottom: Spacing.base,
      gap: Spacing.sm,
    },
    bullet: {
      width: 6,
      height: 6,
      borderRadius: 3,
      marginTop: 8,
      backgroundColor: Colors.primary,
    },
    bulletText: {
      flex: 1,
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      lineHeight: Typography.sm * 1.5,
      textAlign: "left",
      color: Colors.textSecondary,
    },
    contactBtn: {
      marginTop: Spacing.sm,
      paddingVertical: Spacing.sm,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.primaryMuted,
      borderRadius: BorderRadius.md,
      backgroundColor: Colors.primarySubtle,
    },
    contactBtnText: {
      color: Colors.primary,
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      fontWeight: Typography.medium,
    },
  });
