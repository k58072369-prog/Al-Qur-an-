import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SURAHS } from "../data/quranMeta";
import { useAppStore } from "../store/AppStore";
import { BorderRadius, Spacing, Typography, useTheme } from "../theme";
import { toArabicNumerals } from "../utils/helpers";

const { width } = Dimensions.get("window");

import { QuranStore, Verse } from "../store/QuranStore";

export default function QuizScreen() {
  const Colors = useTheme();
  const { getMemorizedPages } = useAppStore();
  const styles = useMemo(() => getStyles(Colors), [Colors]);

  const memorizedPages = useMemo(() => getMemorizedPages(), []);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const startNewQuestion = async () => {
    setShowAnswer(false);
    const q = await generateQuestion();
    setCurrentQuestion(q);
  };

  useEffect(() => {
    startNewQuestion();
  }, []);

  const generateQuestion = async (): Promise<any> => {
    if (memorizedPages.length === 0) return null;
    setIsLoading(true);

    try {
      let attempts = 0;
      while (attempts < 10) {
        attempts++;
        const randomPageObj =
          memorizedPages[Math.floor(Math.random() * memorizedPages.length)];
        
        const verses = await QuranStore.getVerses(randomPageObj.pageNumber);

        if (verses.length < 4) continue;

        const gapSize = Math.random() > 0.5 ? 3 : 5;
        const totalNeeded = gapSize + 2;

        if (verses.length < totalNeeded) continue;

        const startIdx = Math.floor(
          Math.random() * (verses.length - (totalNeeded - 1)),
        );
        const startVerse = verses[startIdx];
        const gapVerses = verses.slice(startIdx + 1, startIdx + gapSize + 1);
        const targetVerse = verses[startIdx + gapSize + 1];

        const surah = SURAHS.find(
          (s) =>
            randomPageObj.pageNumber >= s.startPage &&
            randomPageObj.pageNumber <= s.endPage,
        );

        return {
          startVerse,
          gapVerses,
          targetVerse,
          surahName: surah?.nameAr,
          gapSize,
        };
      }
      return null;
    } catch (e) {
      console.error("Error generating question", e);
      return null;
    } finally {
      setIsLoading(false);
    }
  };


  if (memorizedPages.length === 0) {
    return (
      <View style={styles.container}>
        <StatusBar 
          barStyle={Colors.background === "#07090F" ? "light-content" : "dark-content"} 
          translucent 
          backgroundColor="transparent" 
        />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons
              name="chevron-forward"
              size={24}
              color={Colors.textPrimary}
            />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>اختبار الحفظ</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="school" size={48} color={Colors.primary} />
          </View>
          <Text style={styles.emptyText}>لا يوجد محفوظ للمراجعة</Text>
          <Text style={styles.emptySub}>
            قم بتحديد السور التي تحفظها في الخطة لتبدأ اختبارات الحفظ الذكية
          </Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => router.back()}
          >
            <Text style={styles.primaryBtnText}>العودة للرئيسية</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        barStyle={Colors.background === "#07090F" ? "light-content" : "dark-content"} 
        translucent 
        backgroundColor="transparent" 
      />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>التسميع الذاتي</Text>
        <TouchableOpacity style={styles.backBtn} onPress={startNewQuestion}>
          <Ionicons name="refresh" size={20} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loaderArea}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loaderText}>جاري اختيار مقطع من محفوظك...</Text>
          </View>
        ) : currentQuestion ? (
          <View style={styles.quizWrapper}>
            {/* Context Header */}
            <View style={styles.contextHeader}>
              <View style={styles.surahBadge}>
                <Text style={styles.surahBadgeText}>
                  {currentQuestion.surahName}
                </Text>
              </View>
              <Text style={styles.infoText}>
                مقدار التسميع: {toArabicNumerals(currentQuestion.gapSize)} آيات
              </Text>
            </View>

            {/* Start Block */}
            <Animated.View
              entering={FadeInDown.delay(200)}
              style={styles.verseCard}
            >
              <Text style={styles.cardLabel}>ابدأ التسميع من بعد الآية:</Text>
              <Text style={styles.verseUthmani}>
                {currentQuestion.startVerse.text_uthmani}
              </Text>
              <Text style={styles.verseKey}>
                آية {toArabicNumerals(currentQuestion.startVerse.verse_key)}
              </Text>
            </Animated.View>

            {/* Gap Visualizer */}
            <View style={styles.gapVisual}>
              <View style={styles.gapLine} />
              <View style={styles.gapIconBox}>
                <Ionicons name="mic" size={24} color={Colors.primary} />
              </View>
              <View style={styles.gapLine} />
            </View>

            {/* Target Block */}
            <Animated.View
              entering={FadeInDown.delay(400)}
              style={[styles.verseCard, { borderColor: Colors.borderLight }]}
            >
              <Text style={styles.cardLabel}>حتى تصل إلى الآية:</Text>
              <Text style={[styles.verseUthmani, { opacity: 0.7 }]}>
                {currentQuestion.targetVerse.text_uthmani}
              </Text>
              <Text style={styles.verseKey}>
                آية {toArabicNumerals(currentQuestion.targetVerse.verse_key)}
              </Text>
            </Animated.View>

            {/* Answer Toggle */}
            <View style={styles.actionArea}>
              {!showAnswer ? (
                <TouchableOpacity
                  style={styles.showAnswerBtn}
                  onPress={() => setShowAnswer(true)}
                >
                  <Text style={styles.showAnswerText}>إظهار الآيات للتأكد</Text>
                  <Ionicons name="eye" size={20} color="#FFF" />
                </TouchableOpacity>
              ) : (
                <Animated.View entering={FadeIn} style={styles.answerSection}>
                  <View style={styles.answerHeader}>
                    <Text style={styles.answerTitle}>الآيات المقصودة:</Text>
                  </View>
                  <View style={styles.answerCloud}>
                    {currentQuestion.gapVerses.map((v: Verse, i: number) => (
                      <Text key={i} style={styles.gapVerseText}>
                        {v.text_uthmani} ﴿{toArabicNumerals(i + 1)}﴾
                      </Text>
                    ))}
                  </View>

                  <View style={styles.resultActions}>
                    <TouchableOpacity
                      style={styles.nextBtn}
                      onPress={startNewQuestion}
                    >
                      <Text style={styles.nextBtnText}>المقطع التالي</Text>
                      <Ionicons name="chevron-back" size={20} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              )}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.background },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: 60,
      paddingHorizontal: Spacing.xl,
      paddingBottom: Spacing.lg,
      backgroundColor: Colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    backBtn: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: Colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: Colors.border,
    },
    headerTitle: {
      fontFamily: Typography.heading,
      fontSize: 18,
      fontWeight: "bold",
      color: Colors.textPrimary,
    },
    content: { padding: Spacing.xl, paddingBottom: 100 },
    quizWrapper: { gap: Spacing.lg },
    contextHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: Spacing.md,
    },
    surahBadge: {
      backgroundColor: `${Colors.gold}12`,
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${Colors.gold}20`,
    },
    surahBadgeText: { color: Colors.gold, fontWeight: "bold", fontSize: 13 },
    infoText: { fontSize: 12, color: Colors.textSecondary, fontWeight: "bold" },
    verseCard: {
      backgroundColor: Colors.surface,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1.5,
      borderColor: Colors.border,
      alignItems: "center",
    },
    cardLabel: {
      fontSize: 13,
      color: Colors.primary,
      fontWeight: "bold",
      marginBottom: Spacing.lg,
      opacity: 0.8,
    },
    verseUthmani: {
      fontFamily: Typography.quran,
      fontSize: 26,
      color: Colors.textPrimary,
      textAlign: "center",
      lineHeight: 48,
      marginBottom: Spacing.md,
    },
    verseKey: {
      fontSize: 12,
      color: Colors.textTertiary,
      fontFamily: Typography.body,
    },
    gapVisual: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      marginVertical: -Spacing.sm,
    },
    gapLine: {
      flex: 1,
      height: 2,
      backgroundColor: Colors.border,
      marginHorizontal: 10,
      borderStyle: "dashed",
    },
    gapIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: `${Colors.primary}10`,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
      borderColor: `${Colors.primary}20`,
    },
    actionArea: { marginTop: Spacing.xl },
    showAnswerBtn: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
      paddingVertical: 18,
      borderRadius: BorderRadius.xl,
    },
    showAnswerText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
    answerSection: { gap: Spacing.md },
    answerHeader: {
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      paddingBottom: 10,
      marginBottom: 5,
    },
    answerTitle: {
      fontSize: 15,
      fontWeight: "bold",
      color: Colors.textPrimary,
      textAlign: "right",
    },
    answerCloud: {
      backgroundColor: Colors.surfaceElevated,
      borderRadius: BorderRadius.xl,
      padding: Spacing.xl,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    gapVerseText: {
      fontFamily: Typography.quran,
      fontSize: 22,
      color: Colors.textPrimary,
      textAlign: "center",
      lineHeight: 40,
      marginBottom: Spacing.md,
    },
    resultActions: { marginTop: Spacing.lg, alignItems: "center" },
    nextBtn: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 10,
      paddingHorizontal: 30,
      paddingVertical: 15,
      borderRadius: BorderRadius.lg,
      backgroundColor: Colors.surfaceElevated,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    nextBtnText: { fontWeight: "bold", color: Colors.textPrimary },
    loaderArea: {
      height: 400,
      justifyContent: "center",
      alignItems: "center",
      gap: Spacing.lg,
    },
    loaderText: { color: Colors.textSecondary, fontSize: 14 },
    offlineWarning: {
      backgroundColor: `${Colors.primary}10`,
      borderRadius: BorderRadius.lg,
      padding: Spacing.md,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: Spacing.lg,
      borderWidth: 1,
      borderColor: `${Colors.primary}20`,
    },
    offlineTitle: {
      fontFamily: Typography.heading,
      fontSize: 14,
      color: Colors.textPrimary,
      textAlign: "right",
    },
    offlineSub: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textSecondary,
      textAlign: "right",
      marginTop: 2,
    },
    downloadBtn: {
      backgroundColor: Colors.primary,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 10,
    },
    downloadBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 13 },
    emptyContainer: {
      height: 500,
      justifyContent: "center",
      alignItems: "center",
      padding: Spacing.xl,
      gap: Spacing.lg,
    },
    emptyIconBox: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${Colors.primary}10`,
      alignItems: "center",
      justifyContent: "center",
    },
    emptyText: { fontSize: 22, fontWeight: "bold", color: Colors.textPrimary },
    emptySub: {
      fontSize: 15,
      color: Colors.textSecondary,
      textAlign: "center",
      lineHeight: 24,
    },
    primaryBtn: {
      marginTop: Spacing.lg,
      paddingHorizontal: 32,
      paddingVertical: 14,
      backgroundColor: Colors.primary,
      borderRadius: BorderRadius.lg,
    },
    primaryBtnText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  });
