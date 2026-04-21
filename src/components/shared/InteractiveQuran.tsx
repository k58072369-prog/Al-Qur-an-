import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { Shadow, Spacing, Typography, useTheme } from "../../theme";
import { toArabicNumerals } from "../../utils/helpers";

const { width } = Dimensions.get("window");

interface Verse {
  id: number;
  verse_key: string;
  text_uthmani: string;
}

interface PageData {
  pageNumber: number;
  verses: Verse[];
}

interface InteractiveQuranProps {
  visible: boolean;
  pages: number[];
  moduleId: string;
  moduleName: string;
  onClose: () => void;
  onComplete?: () => void;
}

export function InteractiveQuran({
  visible,
  pages,
  moduleId,
  moduleName,
  onClose,
  onComplete,
}: InteractiveQuranProps) {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [pagesData, setPagesData] = useState<PageData[]>([]);

  // Features state
  const isMemorizationOrReview =
    moduleId === "memorization" || moduleId.includes("review");
  const isPreparation = moduleId.includes("preparation");
  
  const [isMasked, setIsMasked] = useState(false);
  const [revealedVerses, setRevealedVerses] = useState<Set<string>>(new Set());
  
  // Timer & Reps
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [reps, setReps] = useState(0);

  useEffect(() => {
    let interval: any;
    if (visible) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    } else {
      setSecondsElapsed(0);
      setRevealedVerses(new Set());
      setReps(0);
    }
    return () => clearInterval(interval);
  }, [visible]);

  useEffect(() => {
    if (visible && pages.length > 0) {
      loadPagesData();
    }
  }, [visible, pages]);

  const loadPagesData = async () => {
    setIsLoading(true);
    setErrorMsg("");
    setPagesData([]);
    
    try {
      let fetched: PageData[] = [];
      // Fetch pages consecutively to keep order
      for (const pageNum of pages) {
        const res = await fetch(
          `https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${pageNum}`
        );
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        fetched.push({
          pageNumber: pageNum,
          verses: data.verses,
        });
      }
      setPagesData(fetched);
    } catch (e) {
      setErrorMsg("حدث خطأ في تحميل الصفحات. يرجى التحقق من اتصال الإنترنت.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMask = () => {
    setIsMasked(!isMasked);
    if (!isMasked) {
      // hiding all
      setRevealedVerses(new Set());
    }
  };

  const toggleVerseReveal = (verseKey: string) => {
    if (!isMasked) return;
    setRevealedVerses((prev) => {
      const next = new Set(prev);
      if (next.has(verseKey)) next.delete(verseKey);
      else next.add(verseKey);
      return next;
    });
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.textPrimary} />
            </TouchableOpacity>
            
            <View style={styles.headerTitleBox}>
              <Text style={styles.headerTitle}>{moduleName}</Text>
              <View style={styles.timerChip}>
                <Ionicons name="time-outline" size={14} color={Colors.textTertiary} />
                <Text style={styles.timerText}>{formatTimer(secondsElapsed)}</Text>
              </View>
            </View>

            {/* End Session Button inside header to save space */}
            <TouchableOpacity 
              style={[styles.finishBtn, { backgroundColor: Colors.success }]} 
              onPress={() => {
                if (onComplete) onComplete();
                onClose();
              }}
            >
              <Text style={styles.finishBtnText}>إنهاء</Text>
            </TouchableOpacity>
          </View>

          {/* Tools Bar (Contextual) */}
          <View style={styles.toolsBar}>
            {isMemorizationOrReview && (
              <TouchableOpacity 
                style={[styles.toolBtn, isMasked && { backgroundColor: Colors.primaryMuted }]}
                onPress={toggleMask}
              >
                <Ionicons 
                  name={isMasked ? "eye-off" : "eye"} 
                  size={20} 
                  color={isMasked ? Colors.primary : Colors.textSecondary} 
                />
                <Text style={[styles.toolBtnText, isMasked && { color: Colors.primary }]}>
                  {isMasked ? "إظهار الكل" : "إخفاء (اختبار)"}
                </Text>
              </TouchableOpacity>
            )}

            {isPreparation && (
              <View style={styles.infoModeChip}>
                <Ionicons name="book-outline" size={18} color={Colors.primary} />
                <Text style={styles.infoModeText}>وضع التهيئة</Text>
              </View>
            )}
            
            {/* Pages count info */}
            <View style={{ flex: 1 }} />
            <Text style={styles.pagesCount}>
              {toArabicNumerals(pages.length)} صفحات
            </Text>
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {isLoading ? (
              <View style={styles.centerArea}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>جاري تحميل الصفحات...</Text>
              </View>
            ) : errorMsg ? (
              <View style={styles.centerArea}>
                <Ionicons name="cloud-offline-outline" size={60} color={Colors.textTertiary} />
                <Text style={styles.errorText}>{errorMsg}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={loadPagesData}>
                  <Text style={styles.retryBtnText}>إعادة المحاولة</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView 
                style={styles.textScroll}
                contentContainerStyle={styles.textScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {pagesData.map((pageData, pIdx) => (
                  <View key={`page-${pageData.pageNumber}`} style={styles.pageContainer}>
                    <View style={styles.pageHeader}>
                      <Text style={styles.pageHeaderText}>
                        صفحة {toArabicNumerals(pageData.pageNumber)}
                      </Text>
                      <View style={styles.pageHeaderLine} />
                    </View>

                    <Text style={styles.quranTextContainer}>
                      {pageData.verses.map((v) => {
                        const isHidden = isMasked && !revealedVerses.has(v.verse_key);
                        
                        return (
                          <Text
                            key={v.verse_key}
                            onPress={() => toggleVerseReveal(v.verse_key)}
                            style={[
                              styles.quranText,
                              isHidden && styles.quranTextHidden
                            ]}
                          >
                            {isHidden ? " ┄┄┄ " : ` ${v.text_uthmani} `}
                            <Text style={styles.ayahNumberBadge}>
                               {toArabicNumerals(parseInt(v.verse_key.split(":")[1]))} 
                            </Text>
                          </Text>
                        );
                      })}
                    </Text>
                  </View>
                ))}
                <View style={{ height: 120 }} />
              </ScrollView>
            )}
          </View>

          {/* Floating Repetition Counter (only for memorization) */}
          {moduleId === 'memorization' && !isLoading && !errorMsg && (
            <Animated.View entering={FadeInDown} style={styles.repContainer}>
              <Text style={styles.repLabel}>مرات التكرار</Text>
              <View style={styles.repControls}>
                <TouchableOpacity 
                  onPress={() => setReps(r => Math.max(0, r - 1))}
                  style={styles.repBtn}
                >
                  <Ionicons name="remove" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.repCount}>{reps}</Text>
                <TouchableOpacity 
                  onPress={() => setReps(r => r + 1)}
                  style={styles.repBtn}
                >
                  <Ionicons name="add" size={24} color={Colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

        </SafeAreaView>
      </View>
    </Modal>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: Colors.background,
    },
    safeContainer: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    headerTitleBox: {
      alignItems: "center",
    },
    headerTitle: {
      fontFamily: Typography.heading,
      fontSize: 16,
      fontWeight: "bold",
      color: Colors.textPrimary,
    },
    timerChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      marginTop: 2,
    },
    timerText: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textTertiary,
    },
    closeBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: Colors.surfaceElevated,
      alignItems: "center",
      justifyContent: "center",
    },
    finishBtn: {
      paddingHorizontal: Spacing.md,
      paddingVertical: 8,
      borderRadius: 12,
      ...Shadow.sm,
    },
    finishBtnText: {
      color: "#FFF",
      fontSize: 13,
      fontWeight: "bold",
    },
    toolsBar: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.surfaceElevated,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
    },
    toolBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: Colors.surface,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    toolBtnText: {
      fontSize: 12,
      fontWeight: "bold",
      color: Colors.textSecondary,
    },
    infoModeChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    infoModeText: {
      fontSize: 12,
      fontWeight: "bold",
      color: Colors.primary,
    },
    pagesCount: {
      fontSize: 12,
      color: Colors.textTertiary,
      fontFamily: Typography.body,
    },
    mainContent: {
      flex: 1,
    },
    centerArea: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.md,
      padding: Spacing.xl,
    },
    loaderText: {
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textSecondary,
    },
    errorText: {
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textSecondary,
      textAlign: "center",
    },
    retryBtn: {
      paddingHorizontal: Spacing.xl,
      paddingVertical: Spacing.sm,
      backgroundColor: Colors.primary,
      borderRadius: 12,
      marginTop: Spacing.md,
    },
    retryBtnText: {
      color: "#FFF",
      fontWeight: "bold",
    },
    textScroll: {
      flex: 1,
    },
    textScrollContent: {
      padding: Spacing.xl,
    },
    pageContainer: {
      marginBottom: Spacing["4xl"],
    },
    pageHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: Spacing.xl,
    },
    pageHeaderText: {
      fontSize: 14,
      fontWeight: "bold",
      color: Colors.textTertiary,
      fontFamily: Typography.body,
    },
    pageHeaderLine: {
      flex: 1,
      height: 1,
      backgroundColor: Colors.border,
    },
    quranTextContainer: {
      textAlign: "center",
      lineHeight: 60, // adequate leading for Uthmani scripts
      direction: "rtl",
    },
    quranText: {
      fontFamily: Typography.quran,
      fontSize: 22,
      color: Colors.textPrimary,
    },
    quranTextHidden: {
      color: Colors.borderLight, // Looks like a placeholder
      backgroundColor: Colors.surfaceElevated,
      borderRadius: 4,
    },
    ayahNumberBadge: {
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textTertiary,
    },
    repContainer: {
      position: 'absolute',
      bottom: Spacing.xl,
      alignSelf: 'center',
      backgroundColor: Colors.surfaceElevated,
      borderRadius: 30,
      paddingHorizontal: Spacing.lg,
      paddingVertical: Spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
      borderWidth: 1,
      borderColor: Colors.border,
      ...Shadow.lg,
    },
    repLabel: {
      fontSize: 12,
      fontWeight: 'bold',
      color: Colors.textSecondary,
      marginRight: Spacing.sm,
    },
    repControls: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: Spacing.md,
    },
    repBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: Colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: Colors.borderLight,
    },
    repCount: {
      fontSize: 20,
      fontWeight: '900',
      color: Colors.primary,
      minWidth: 24,
      textAlign: 'center',
    }
  });
