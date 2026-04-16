import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Image,
  Linking,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";

export default function AppExplanationScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const FortressCard = ({
    title,
    content,
    icon,
    color,
  }: {
    title: string;
    content: string | React.ReactNode;
    icon: string;
    color: string;
  }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIconBox, { backgroundColor: `${color}15` }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <Text style={[styles.cardTitle, { color }]}>{title}</Text>
      </View>
      <View style={styles.cardBody}>
        {typeof content === "string" ? (
          <Text style={styles.paragraph}>{content}</Text>
        ) : (
          content
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <View style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={Colors.textSecondary}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شرح التطبيق</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.heroSection}>
          <View style={styles.iconCircle}>
            <Ionicons
              name="shield-checkmark"
              size={42}
              color={Colors.primary}
            />
          </View>
          <Text style={styles.mainTitle}>نظام مفاتيح تثبيت القرآن</Text>
          <Text style={styles.mainDescription}>
            نظام تراكمي يهدف لجعل حفظ القرآن الكريم راسخاً كحفظ سورة الفاتحة،
            يتطلب الهمة العالية والالتزام بالوقت للوصول للإتقان التام.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.presentationCard}
          onPress={() =>
            Linking.openURL(
              "https://drive.google.com/file/d/14qbC-np5qFv35H_FEofTCTnSyu1j4aap/view?usp=sharing",
            )
          }
        >
          <View style={styles.presentationGradient}>
            <View style={styles.presentationIconBox}>
              <Ionicons name="play" size={20} color={Colors.gold} />
            </View>
            <View style={styles.presentationInfo}>
              <Text style={styles.presentationTitle}>
                عرض تقديمي لطريقة مفاتيح تثبيت القرآن
              </Text>
              <Text style={styles.presentationSubtitle}>
                شاهد الشرح الكامل للطريقة بشكل احترافي
              </Text>
            </View>
            <Ionicons
              name="open-outline"
              size={18}
              color={Colors.textTertiary}
            />
          </View>
        </TouchableOpacity>

        {/* Section 1: Methodology */}
        <View style={styles.sectionHeader}>
          <View style={styles.sectionLine} />
          <Text style={[styles.sectionTitle, { color: Colors.primary }]}>
            منهجية الحصون الخمسة
          </Text>
          <View style={styles.sectionLine} />
        </View>

        <FortressCard
          title="المرحلة الأولى: الختمة (التلاوة والاستماع)"
          icon="book-outline"
          color={Colors.fortressRecitation}
          content={
            <View>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>ختمة التلاوة:</Text> قراءة جزئين
                يومياً (40 صفحة) بطريقة "الحدر"، بحيث لا يستغرق الجزء أكثر من 20
                دقيقة. الهدف هو ختم المصحف كل أسبوعين لتثبيت الحفظ بصرياً.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>ختمة الاستماع:</Text> الاستماع إلى
                حزب واحد يومياً (نصف جزء)، ويُفضل بصوت الشيخ الحصري لضبط مخارج
                الحروف.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="المرحلة الثانية: التحضير"
          icon="timer-outline"
          color={Colors.fortressPreparation}
          content={
            <View>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>التحضير الأسبوعي:</Text> قراءة
                الصفحات التي ستحفظها في الأسبوع القادم يومياً طوال الأسبوع
                الحالي.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>التحضير الليلي:</Text> قبل النوم
                لمدة 30 دقيقة؛ (15 دقيقة قراءة و15 دقيقة استماع) للصفحة المقررة
                غداً.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>التحضير القبلي:</Text> قبل البدء
                بالحفظ الفعلي بـ 15 دقيقة لتنشيط الذهن.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="المرحلة الثالثة: الحفظ الجديد"
          icon="create-outline"
          color={Colors.fortressMemorization}
          content="تكرار الصفحة أو الصفحات الجديدة لمدة لا تقل عن 15 دقيقة. الالتزام بالوقت ضروري حتى لو شعرت بالحفظ السريع، لأن التكرار هو ما ينقل الحفظ للذاكرة البعيدة."
        />

        <FortressCard
          title="المرحلة الرابعة: مراجعة القريب"
          icon="sync-outline"
          color={Colors.fortressReview}
          content="تبدأ بعد حفظ أول 10-20 صفحة، وتتمثل في مراجعة آخر ما تم حفظه (بمقدار جزء تقريباً) يومياً قبل البدء في الحفظ الجديد لضمان عدم تفلته."
        />

        <FortressCard
          title="المرحلة الخامسة: مراجعة البعيد"
          icon="layers-outline"
          color={Colors.blue}
          content="تبدأ عند تجاوز حفظ جزئين فأكثر. للمتقدمين (من حفظوا 15 جزءاً مثلاً)، تكون مراجعة البعيد بمعدل جزئين يومياً."
        />

        {/* Section: How to Use */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.sectionLine} />
          <Text style={[styles.sectionTitle, { color: Colors.secondary }]}>
            طريقة استخدام التطبيق
          </Text>
          <View style={styles.sectionLine} />
        </View>

        <FortressCard
          title="1. التفاعل مع أنواع المهام"
          icon="options-outline"
          color={Colors.secondary}
          content={
            <View>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>الحفظ الجديد:</Text> استخدم عداد التكرار والمؤقت لضمان قضاء 15 دقيقة على الأقل في الصفحة؛ التكرار هو سر الانتقال للذاكرة الدائمة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>المراجعة (قريب/بعيد):</Text> هدفك هنا هو التثبيت. استخدم المؤقت لقياس سرعة استحضارك للآيات، وسجل تقييمك بدقة ليعرف التطبيق متى يسألك فيها مرة أخرى.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>الاستماع والتلاوة:</Text> استثمر مشغل الصوت المدمج مع النص العثماني لتصحيح التشكيل وتثبيت صورة الصفحة بصرياً قبل البدء بالحفظ.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="2. خوض جلسة الحفظ الذكية"
          icon="flash-outline"
          color={Colors.secondary}
          content={
            <View>
              <Text style={styles.paragraph}>
                بمجرد الضغط على "ابدأ"، ستدخل في جلسة تركيز كاملة.
              </Text>
              <Text style={styles.subParagraph}>
                • ابدأ بضبط <Text style={styles.bold}>رقم الآية والصفحة</Text> في خانة الإعداد.
              </Text>
              <Text style={styles.subParagraph}>
                • تابع مع المصحف المطبوع وقم بزيادة <Text style={styles.bold}>عداد التكرار</Text> في التطبيق مع كل مرة تنهي فيها الآية؛ هذا يحفزك ذهنياً ويقيس مجهودك.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="3. فهم التقييم والنتائج"
          icon="medal-outline"
          color={Colors.secondary}
          content={
            <View>
              <Text style={styles.paragraph}>
                بعد انتهاء كل جلسة، إنجازك لا ينتهي:
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>التقييم:</Text> يحدد خوارزمية التطبيق لمواعيد المراجعة القادمة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>الإحصائيات:</Text> ستجد دوائر التقدم في الشاشة الرئيسية تكتمل ببطء لتعكس مدى قربك من ختم القرآن وإتقانه.
              </Text>
            </View>
          }
        />

        {/* Section 2: App Features */}
        <View style={[styles.sectionHeader, { marginTop: Spacing.xl }]}>
          <View style={styles.sectionLine} />
          <Text style={[styles.sectionTitle, { color: Colors.gold }]}>
            مميزات التطبيق الذكية
          </Text>
          <View style={styles.sectionLine} />
        </View>

        <FortressCard
          title="نظام المؤقت والتحكم الذكي"
          icon="timer"
          color={Colors.gold}
          content={
            <View>
              <Text style={styles.paragraph}>
                المؤقت ليس مجرد وسيلة لحساب الوقت، بل هو أداة لضمان "جودة
                التكرار" اللازمة لنقل الآيات إلى الذاكرة الدائمة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> استخدم "إعداد
                البداية" لتحديد الآية التي ستبدأ بها بدقة. عند بدء الجلسة، ابقِ
                تركيزك كاملاً داخل التطبيق؛ فالمؤقت يمنع التشتت ويجبرك على إعطاء
                كل صفحة حقها من الوقت حتى لو شعرت بأنك حفظتها سريعاً. تكرار
                الآية والصفحة بالعداد الموجود يضمن لك رسوخاً لا يتزعزع.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="ميزان الرسوخ (التقييم الذكي)"
          icon="checkbox-outline"
          color={Colors.success}
          content={
            <View>
              <Text style={styles.paragraph}>
                هذا الميزان هو "البوصلة" التي تحدد جودة حفظك وتمنعك من "تراكم
                النسيان".
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> بعد كل ورد،
                كن صادقاً في التقييم (ضعيف، متوسط، قوي). إذا اخترت "ضعيف"، سيقوم
                النظام بذكاء بتقريب موعد المراجعة القادم لتدارك الصفحة قبل
                ضياعها. أما "قوي" فيجعل النظام يباعد الفترات لتركز مجهودك على
                الجديد. هذا يوفر عليك الجهد الضائع في مراجعة ما هو محفوظ فعلاً.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="مشغل الصوت بالنص العثماني"
          icon="musical-notes-outline"
          color={Colors.fortressRecitation}
          content={
            <View>
              <Text style={styles.paragraph}>
                في قسم "الاستماع"، لا يقدم التطبيق صوتاً فقط، بل تجربة "تلقي"
                كاملة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> عند تشغيل
                الاستماع بصوت الشيخ الحصري، يعرض التطبيق النص القرآني بالرسم
                العثماني متزامناً مع القراءة. هذا الربط بين السمع والبصر هو أقوى
                وسيلة لتثبيت شكل الصفحة في ذهنك ومنع أخطاء التشكيل.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="خطط الحفظ المرنة"
          icon="calendar-outline"
          color={Colors.primary}
          content={
            <View>
              <Text style={styles.paragraph}>
                يتكيف التطبيق مع قدراتك المختلفة، سواء كنت تحفظ صفحة أو اثنتين يومياً.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> يمكنك اختيار "خطة الحفظ" التي تناسب وقتك من شاشة الإعدادات، وسيقوم النظام تلقائياً بإعادة ترتيب مواعيد "مراجعة البعيد" و "ختمة التلاوة" لتتوافق مع سرعتك الجديدة في الإنجاز.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="الخصوصية والتركيز التام"
          icon="lock-closed-outline"
          color={Colors.secondary}
          content={
            <View>
              <Text style={styles.paragraph}>
                بيئة آمنة وخالية من المشتتات، مصممة خصيصاً لجلال القرآن الكريم.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> التطبيق يعمل بالكامل بدون إعلانات وبدون الحاجة لإنترنت في معظم وظائفه، مما يضمن لك "الخلوة" المطلوبة للحفظ دون إشعارات مزعجة أو تتبع لبياناتك الشخصية.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="خريطة إنجاز الأجزاء"
          icon="map-outline"
          color={Colors.blue}
          content={
            <View>
              <Text style={styles.paragraph}>
                عرض مرئي شامل لكل جزء وصفحة في القرآن الكريم، يحول رحلة الـ 604
                صفحة إلى خطوات واضحة وملموسة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> استخدم
                الخريطة لرؤية "الصورة الكبيرة". عندما تلون الصفحات التي أتممتها
                بالأخضر، سيعطيك ذلك دفعة معنوية هائلة للاستمرار. كما يمكنك
                العودة لأي صفحة أو جزء بضغطة واحدة لمراجعته أو تعديل تقييمه.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="سلسلة الإنجاز وتنبيهات الالتزام"
          icon="flame-outline"
          color={Colors.warning}
          content={
            <View>
              <Text style={styles.paragraph}>
                يعمل التطبيق كمدرب شخصي (Personal Coach) يشجعك على الاستمرار
                وبناء "عادة" التلاوة اليومية.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> حافظ على "رقم
                السلسلة" (Streak) من الانقطاع؛ فرؤية رقم أيام التزامك يزداد
                يوماً بعد يوم هو أكبر محفز لمنع التكاسل. بالإضافة لذلك، قم بضبط
                التنبيهات في الأوقات التي تكون فيها فارغاً (كالتبكير بعد الفجر)،
                ليرشدك التطبيق للبدء بوردك فوراً.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="المحلل الذكي (قريب وبعيد)"
          icon="analytics-outline"
          color={Colors.secondary}
          content={
            <View>
              <Text style={styles.paragraph}>
                يقوم التطبيق بـ "عملية حسابية معقدة" خلف الكواليس لتحديد ما يجب
                عليك مراجعته يومياً.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> لا تشغل بالك
                بحساب عدد الصفحات؛ فالتطبيق يعرف تلقائياً آخر ما حفظت ويصنفه كـ
                "مراجعة صغرى/قريبة"، ويحسب الأجزاء القديمة كـ "مراجعة
                كبرى/بعيدة" ليضمن لك تغطية المصحف كاملاً في الفترات المقررة.
              </Text>
            </View>
          }
        />

        <FortressCard
          title="مشغل الصوت بالنص العثماني"
          icon="musical-notes-outline"
          color={Colors.fortressRecitation}
          content={
            <View>
              <Text style={styles.paragraph}>
                في قسم "الاستماع"، لا يقدم التطبيق صوتاً فقط، بل تجربة "تلقي"
                كاملة.
              </Text>
              <Text style={styles.subParagraph}>
                • <Text style={styles.bold}>كيف تستفيد منه؟</Text> عند تشغيل
                الاستماع بصوت الشيخ الحصري، يعرض التطبيق النص القرآني بالرسم
                العثماني متزامناً مع القراءة. هذا الربط بين السمع والبصر هو أقوى
                وسيلة لتثبيت شكل الصفحة في ذهنك ومنع أخطاء التشكيل.
              </Text>
            </View>
          }
        />

        <View style={styles.timeCard}>
          <View style={styles.timeGradient}>
            <View style={styles.timeInfo}>
              <Text style={styles.timeTitle}>إدارة الوقت اليومي</Text>
              <Text style={styles.timeText}>
                تحتاج هذه الخطة إلى حوالي ساعة إلى ساعة ونصف يومياً، موزعة على
                فترات (قبل النوم، عند الاستيقاظ، ووقت الحفظ).
              </Text>
            </View>
            <Ionicons name="alarm-outline" size={24} color={Colors.primary} />
          </View>
        </View>

        {/* Developer Section */}
        <View style={styles.devCard}>
          <Image
            source={require("../../assets/images/moustafa.jpg")}
            style={styles.devImage}
          />
          <Text style={styles.devName}>م/ مصطفى أحمد</Text>
          <Text style={styles.devTitle}>مطور التطبيق</Text>

          <View style={styles.sadaqahContainer}>
            <Text style={styles.sadaqahText}>صدقة جارية</Text>
            <Text style={styles.duaText}>
              نسألكم الدعاء لي ولوالدي بظهر الغيب، وجزاكم الله خيراً.
            </Text>
          </View>

          <View style={styles.socialRow}>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() =>
                Linking.openURL("https://www.facebook.com/Mostafa7Ahmad")
              }
            >
              <Ionicons name="logo-facebook" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => Linking.openURL("https://wa.me/+201120354592")}
            >
              <Ionicons name="logo-whatsapp" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() =>
                Linking.openURL(
                  "https://www.linkedin.com/in/mustafa-ahmad-work",
                )
              }
            >
              <Ionicons name="logo-linkedin" size={20} color={Colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.socialBtn}
              onPress={() => Linking.openURL("https://t.me/+nTRukDn0mAc2Zjc8")}
            >
              <Ionicons name="paper-plane" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
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
      textAlign: "center",
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
    scroll: {
      paddingHorizontal: Spacing.xl,
      paddingTop: Spacing.lg,
      paddingBottom: Spacing["5xl"],
    },
    heroSection: {
      alignItems: "center",
      marginBottom: Spacing["2xl"],
      paddingHorizontal: Spacing.md,
    },
    iconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.primaryMuted,
      borderWidth: 1,
      borderColor: `${Colors.primary}30`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    mainTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: Spacing.sm,
      textAlign: "center",
    },
    mainDescription: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.textSecondary,
      lineHeight: Typography.base * 1.6,
      textAlign: "center",
    },
    card: {
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.xl,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      padding: Spacing.lg,
      marginBottom: Spacing.lg,
    },
    cardHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.md,
      gap: Spacing.md,
    },
    cardIconBox: {
      width: 40,
      height: 40,
      borderRadius: BorderRadius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    cardTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      flex: 1,
      textAlign: "left",
    },
    cardBody: {
      paddingRight: 0,
    },
    paragraph: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.textSecondary,
      lineHeight: Typography.base * 1.7,
      textAlign: "left",
    },
    subParagraph: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.textSecondary,
      lineHeight: Typography.base * 1.7,
      textAlign: "left",
      marginBottom: Spacing.xs,
    },
    bold: {
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
    },
    timeCard: {
      marginTop: Spacing.md,
      borderRadius: BorderRadius.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${Colors.primary}20`,
    },
    timeGradient: {
      flexDirection: "row",
      padding: Spacing.lg,
      alignItems: "center",
      gap: Spacing.lg,
    },
    timeInfo: {
      flex: 1,
    },
    timeTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.primary,
      marginBottom: Spacing.xs,
      textAlign: "left",
    },
    timeText: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      lineHeight: Typography.sm * 1.6,
      textAlign: "left",
    },
    presentationCard: {
      marginBottom: Spacing.xl,
      borderRadius: BorderRadius.xl,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: `${Colors.gold}30`,
    },
    presentationGradient: {
      flexDirection: "row",
      alignItems: "center",
      padding: Spacing.lg,
      gap: Spacing.md,
    },
    presentationIconBox: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: `${Colors.gold}15`,
      alignItems: "center",
      justifyContent: "center",
    },
    presentationInfo: {
      flex: 1,
    },
    presentationTitle: {
      fontFamily: Typography.heading,
      fontSize: Typography.md,
      fontWeight: Typography.bold,
      color: Colors.gold,
      marginBottom: 2,
      textAlign: "left",
    },
    presentationSubtitle: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textSecondary,
      textAlign: "left",
    },
    devCard: {
      marginTop: Spacing.xl,
      backgroundColor: Colors.glass,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      alignItems: "center",
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
    devImage: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: Spacing.md,
      borderWidth: 3,
      borderColor: Colors.primary,
    },
    devName: {
      fontFamily: Typography.heading,
      fontSize: Typography.base,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      marginBottom: 2,
    },
    devTitle: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.primary,
      fontWeight: Typography.medium,
      marginBottom: Spacing.lg,
    },
    sadaqahContainer: {
      alignItems: "center",
      backgroundColor: Colors.primarySubtle,
      padding: Spacing.md,
      borderRadius: BorderRadius.lg,
      marginBottom: Spacing.xl,
      width: "100%",
    },
    sadaqahText: {
      fontFamily: Typography.heading,
      fontSize: Typography.sm,
      fontWeight: Typography.bold,
      color: Colors.primary,
      marginBottom: 4,
    },
    duaText: {
      fontFamily: Typography.body,
      fontSize: Typography.xs,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },
    socialRow: {
      flexDirection: "row",
      gap: Spacing.lg,
      alignItems: "center",
    },
    socialBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    sectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: Spacing.lg,
      width: "100%",
    },
    sectionLine: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.border,
      opacity: 0.3,
    },
    sectionTitle: {
      fontFamily: Typography.heading,
      fontSize: 16,
      fontWeight: "bold",
      textAlign: "center",
      paddingHorizontal: Spacing.md,
    },
  });
