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
import { ExplanationCard } from "../components/shared/ExplanationCard";
import { ExplanationHero } from "../components/explanation/ExplanationHero";
import { PresentationCard, TimeManagementCard } from "../components/explanation/ExplanationSubCards";
import { DeveloperCard } from "../components/explanation/DeveloperCard";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";

export default function AppExplanationScreen() {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const SectionHeader = ({ title, color }: { title: string; color: string }) => (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionLine} />
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      <View style={styles.sectionLine} />
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>شرح التطبيق</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <ExplanationHero Colors={Colors} />
        <PresentationCard Colors={Colors} />

        <SectionHeader title="منهجية الحفظ" color={Colors.primary} />
        <ExplanationCard
          title="المرحلة الأولى: الختمة (التلاوة والاستماع)"
          icon="book-outline"
          color={Colors.fortressRecitation}
          content={
            <View>
              <Text style={styles.subParagraph}>• <Text style={styles.bold}>ختمة التلاوة:</Text> قراءة جزئين يومياً بطريقة "الحدر".</Text>
              <Text style={styles.subParagraph}>• <Text style={styles.bold}>ختمة الاستماع:</Text> الاستماع إلى حزب واحد يومياً بصوت الشيخ الحصري.</Text>
            </View>
          }
        />
        <ExplanationCard
          title="المرحلة الثانية: التحضير"
          icon="timer-outline"
          color={Colors.fortressPreparation}
          content={
            <View>
              <Text style={styles.subParagraph}>• <Text style={styles.bold}>التحضير الأسبوعي:</Text> قراءة صفحات الأسبوع القادم مسبقاً.</Text>
              <Text style={styles.subParagraph}>• <Text style={styles.bold}>التحضير الليلي:</Text> 30 دقيقة قبل النوم للصفحة المقررة غداً.</Text>
              <Text style={styles.subParagraph}>• <Text style={styles.bold}>التحضير القبلي:</Text> 15 دقيقة قبل الحفظ الفعلي.</Text>
            </View>
          }
        />
        <ExplanationCard
          title="المرحلة الثالثة: الحفظ الجديد"
          icon="create-outline"
          color={Colors.fortressMemorization}
          content="تكرار الصفحة الجديدة لمدة لا تقل عن 15 دقيقة لضمان النقل للذاكرة البعيدة."
        />
        <ExplanationCard
          title="المرحلة الرابعة: مراجعة القريب"
          icon="sync-outline"
          color={Colors.fortressReview}
          content="مراجعة آخر ما تم حفظه (بمقدار جزء تقريباً) يومياً لضمان عدم تفلته."
        />
        <ExplanationCard
          title="المرحلة الخامسة: مراجعة البعيد"
          icon="layers-outline"
          color={Colors.blue}
          content="مراجعة الأجزاء القديمة بمعدل جزئين يومياً (للمتقدمين)."
        />

        <SectionHeader title="طريقة استخدام التطبيق" color={Colors.secondary} />
        <ExplanationCard
          title="1. التفاعل مع أنواع المهام"
          icon="options-outline"
          color={Colors.secondary}
          content="استخدم عداد التكرار والمؤقت لضمان 'جودة التكرار' في الحفظ والمراجعة."
        />
        <ExplanationCard
          title="2. خوض جلسة الحفظ الذكية"
          icon="flash-outline"
          color={Colors.secondary}
          content="اضبط نطاق الآيات واستخدم عداد التكرار لزيادة التركيز الذهني."
        />
        <ExplanationCard
          title="3. فهم التقييم والنتائج"
          icon="medal-outline"
          color={Colors.secondary}
          content="تقييمك الصادق يحدد مواعيد المراجعة القادمة عبر الخوارزمية الذكية."
        />

        <SectionHeader title="مميزات التطبيق الذكية" color={Colors.gold} />
        {[
          { title: "نظام المؤقت والتحكم", icon: "timer", color: Colors.gold, content: "وسيلة لضمان جودة التكرار ومنع التشتت أثناء الجلسة." },
          { title: "ميزان الرسوخ الذكي", icon: "checkbox-outline", color: Colors.success, content: "يحدد موعد المراجعة القادم بناءً على قوة حفظك." },
          { title: "مشغل الصوت العثماني", icon: "musical-notes-outline", color: Colors.fortressRecitation, content: "ربط السمع بالبصر عبر عرض النص القرآني المتزامن." },
          { title: "خطط الحفظ المرنة", icon: "calendar-outline", color: Colors.primary, content: "يتكيف النظام مع سرعتك الخاصة سواء كانت صفحة أو أكثر يومياً." },
        ].map((item, i) => (
          <ExplanationCard key={i} title={item.title} icon={item.icon} color={item.color} content={item.content} />
        ))}

        <TimeManagementCard Colors={Colors} />
        <DeveloperCard Colors={Colors} />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: Spacing.xl, paddingBottom: Spacing.md },
    headerTitle: { fontFamily: Typography.heading, fontSize: Typography.lg, fontWeight: Typography.semibold, color: Colors.textPrimary, textAlign: "center" },
    backBtn: { width: 40, height: 40, backgroundColor: Colors.glass, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.glassBorder, alignItems: "center", justifyContent: "center" },
    scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg, paddingBottom: Spacing["5xl"] },
    sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginVertical: Spacing.lg, width: "100%" },
    sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border, opacity: 0.3 },
    sectionTitle: { fontFamily: Typography.heading, fontSize: 16, fontWeight: "bold", textAlign: "center", paddingHorizontal: Spacing.md },
    bold: { fontWeight: Typography.bold, color: Colors.textPrimary },
    subParagraph: { fontFamily: Typography.body, fontSize: 13, color: Colors.textSecondary, lineHeight: 20, textAlign: "left", marginBottom: Spacing.xs },
  });
