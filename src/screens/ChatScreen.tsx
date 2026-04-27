// Chat screen — integrates the provided MOTQN.ai chat (Gemini) into the
// Expo app. The original code was web-only React; here it is adapted to
// React Native components while preserving the AI logic, system prompt
// and overall behavior described in attached_assets/App_*.tsx.

import { Ionicons } from "@expo/vector-icons";
import { GoogleGenAI } from "@google/genai";
import * as Haptics from "expo-haptics";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAppStore } from "../store/AppStore";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../theme";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Same system prompt as the provided MOTQN.ai chat (web) source.
const SYSTEM_INSTRUCTION = `
You are MOTQN.ai, an advanced, high-end AI assistant known for precision, elegance, and deep knowledge.
Your personality is sophisticated, professional, and extremely helpful.
You speak primarily in Arabic (but can respond accurately in other languages if asked).
Your tone should be "Professional and Chic" (رسمي وعصري) - minimalist, authoritative, and respectful.
Provide concise but deep and accurate answers.
Format your responses using Markdown for better readability.
If asked for your name, you are "MOTQN.ai".
`;

// API key is read from a public Expo env var so it is bundled with the app.
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? "";

// Use a stable model that is broadly available on the Gemini API.
const MODEL = "gemini-1.5-flash";

export default function ChatScreen() {
  const Colors = useTheme();
  const styles = useMemo(() => getStyles(Colors), [Colors]);
  const { state } = useAppStore();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);

  const aiRef = useRef<GoogleGenAI | null>(null);
  if (!aiRef.current && GEMINI_API_KEY) {
    aiRef.current = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  }

  const scrollToEnd = () =>
    requestAnimationFrame(() =>
      scrollRef.current?.scrollToEnd({ animated: true })
    );

  const handleStart = () => {
    if (state.settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    setHasStarted(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;
    if (!hasStarted) setHasStarted(true);
    await runSend(text);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");
    await runSend(text);
  };

  const runSend = async (text: string) => {
    if (!text) return;

    if (!aiRef.current) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-warn`,
          role: "assistant",
          content:
            "لم يتم ضبط مفتاح Gemini API بعد. يرجى إضافة EXPO_PUBLIC_GEMINI_API_KEY لتفعيل المحادثة.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (state.settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }

    const userMessage: Message = {
      id: `${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    const assistantId = `${Date.now() + 1}-a`;
    const assistantMessage: Message = {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);
    setIsLoading(true);
    scrollToEnd();

    try {
      // Build conversation history in the format expected by the SDK.
      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text }] });

      const result = await aiRef.current.models.generateContentStream({
        model: MODEL,
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      let full = "";
      for await (const chunk of result) {
        const t = (chunk as any).text;
        if (typeof t === "string") {
          full += t;
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantId ? { ...m, content: full } : m))
          );
          scrollToEnd();
        }
      }
    } catch (err) {
      console.warn("[ChatScreen] AI error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content:
                  "للأسف، واجهت مشكلة في الاتصال بمزود الخدمة. يرجى المحاولة مرة أخرى.",
              }
            : m
        )
      );
    } finally {
      setIsLoading(false);
      scrollToEnd();
    }
  };

  const handleClear = () => {
    if (state.settings.hapticsEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    }
    setMessages([]);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.logoBubble}>
            <Image
              source={require("../../assets/images/logo.png")}
              style={styles.logoImg}
              resizeMode="contain"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>MOTQN.ai</Text>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.statusText}>متصل · مساعدك الذكي</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleClear}
            style={styles.iconBtn}
            accessibilityLabel="تصفير المحادثة"
          >
            <Ionicons
              name="refresh"
              size={20}
              color={Colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          onContentSizeChange={scrollToEnd}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <EmptyState
              Colors={Colors}
              hasStarted={hasStarted}
              onStart={handleStart}
              onPickSuggestion={(s) => sendMessage(s)}
            />
          ) : (
            messages.map((m) => (
              <Bubble key={m.id} message={m} Colors={Colors} />
            ))
          )}
          {isLoading && (
            <View style={styles.typing}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.typingText}>يكتب الآن…</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputBar}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={
              hasStarted ? "اكتب رسالتك هنا…" : "اضغط 'ابدأ الدردشة' للبدء"
            }
            placeholderTextColor={Colors.textTertiary}
            multiline
            maxLength={4000}
            textAlign="right"
            writingDirection="rtl"
            editable={hasStarted && !isLoading}
            onSubmitEditing={handleSend}
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!input.trim() || isLoading || !hasStarted) && { opacity: 0.5 },
            ]}
            onPress={handleSend}
            disabled={!input.trim() || isLoading || !hasStarted}
            accessibilityLabel="إرسال"
          >
            <Ionicons name="paper-plane" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function EmptyState({
  Colors,
  hasStarted,
  onStart,
  onPickSuggestion,
}: {
  Colors: any;
  hasStarted: boolean;
  onStart: () => void;
  onPickSuggestion: (text: string) => void;
}) {
  const styles = getStyles(Colors);
  const suggestions = [
    "اقترح لي خطة مراجعة لجزء عمَّ خلال أسبوع",
    "ما أفضل وقت لحفظ القرآن؟",
    "اشرح لي طريقة الخمسيات في الحفظ",
    "كيف أتغلب على النسيان أثناء المراجعة؟",
  ];
  return (
    <View style={styles.emptyWrap}>
      <View style={styles.emptyLogoCircle}>
        <Image
          source={require("../../assets/images/logo.png")}
          style={{ width: 70, height: 70 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.emptyTitle}>
        {hasStarted ? "كيف يمكنني مساعدتك اليوم؟" : "أهلاً بك في MOTQN.ai"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {hasStarted
          ? "اسأل MOTQN.ai أي شيء عن القرآن، الحفظ، أو خطط المراجعة."
          : "مساعدك الذكي للقرآن والحفظ. اضغط الزر بالأسفل لبدء محادثتك."}
      </Text>

      {!hasStarted && (
        <TouchableOpacity
          style={styles.startBtn}
          onPress={onStart}
          accessibilityLabel="ابدأ الدردشة"
          activeOpacity={0.85}
        >
          <Ionicons name="chatbubbles" size={20} color="#fff" />
          <Text style={styles.startBtnText}>ابدأ الدردشة</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.suggestHeader}>
        {hasStarted ? "جرب أحد الأسئلة:" : "أمثلة على ما يمكنك سؤاله:"}
      </Text>
      <View style={styles.suggestList}>
        {suggestions.map((s) => (
          <TouchableOpacity
            key={s}
            style={styles.suggestionChip}
            onPress={() => onPickSuggestion(s)}
            activeOpacity={0.7}
          >
            <Ionicons name="sparkles" size={12} color={Colors.gold} />
            <Text style={styles.suggestionText}>{s}</Text>
            <Ionicons
              name="arrow-back"
              size={14}
              color={Colors.textTertiary}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function Bubble({ message, Colors }: { message: Message; Colors: any }) {
  const styles = getStyles(Colors);
  const isAssistant = message.role === "assistant";
  const time = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return (
    <Animated.View
      style={[
        styles.bubbleRow,
        isAssistant ? styles.rowAssistant : styles.rowUser,
      ]}
    >
      <View
        style={[
          styles.avatar,
          isAssistant ? styles.avatarAssistant : styles.avatarUser,
        ]}
      >
        {isAssistant ? (
          <Text style={styles.avatarLetter}>M</Text>
        ) : (
          <Ionicons name="person" size={16} color={Colors.textPrimary} />
        )}
      </View>
      <View
        style={[
          styles.bubble,
          isAssistant ? styles.bubbleAssistant : styles.bubbleUser,
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            isAssistant ? styles.textAssistant : styles.textUser,
          ]}
        >
          {message.content || (isAssistant ? "…" : "")}
        </Text>
        <Text style={styles.bubbleTime}>{time}</Text>
      </View>
    </Animated.View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: Colors.background },
    header: {
      paddingTop: Platform.OS === "ios" ? 56 : 36,
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: Colors.border,
      backgroundColor: Colors.surface,
    },
    brandRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: Spacing.md,
    },
    logoBubble: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logoImg: { width: 36, height: 36 },
    title: {
      fontFamily: Typography.heading,
      fontSize: 20,
      fontWeight: "800",
      color: Colors.textPrimary,
      letterSpacing: 0.5,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      marginTop: 2,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#10b981",
    },
    statusText: {
      fontFamily: Typography.body,
      fontSize: 11,
      color: Colors.textTertiary,
    },
    iconBtn: {
      width: 38,
      height: 38,
      borderRadius: 12,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },

    scroll: { flex: 1 },
    scrollContent: {
      padding: Spacing.lg,
      paddingBottom: 180,
    },

    bubbleRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      marginBottom: Spacing.md,
    },
    rowAssistant: { justifyContent: "flex-start" },
    rowUser: { flexDirection: "row-reverse" },

    avatar: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 1,
    },
    avatarAssistant: {
      backgroundColor: Colors.primary,
      borderColor: Colors.primary,
    },
    avatarUser: {
      backgroundColor: Colors.glass,
      borderColor: Colors.glassBorder,
    },
    avatarLetter: {
      color: "#fff",
      fontFamily: Typography.heading,
      fontWeight: "800",
      fontSize: 14,
    },

    bubble: {
      maxWidth: "78%",
      paddingHorizontal: Spacing.md,
      paddingVertical: 10,
      borderRadius: BorderRadius.lg,
    },
    bubbleAssistant: {
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderTopLeftRadius: 4,
    },
    bubbleUser: {
      backgroundColor: Colors.primary,
      borderTopRightRadius: 4,
      ...Shadow.sm,
    },
    bubbleText: {
      fontFamily: Typography.body,
      fontSize: 15,
      lineHeight: 22,
      writingDirection: "rtl",
      textAlign: "right",
    },
    textAssistant: { color: Colors.textPrimary },
    textUser: { color: "#fff" },
    bubbleTime: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.textTertiary,
      marginTop: 4,
      textAlign: "left",
      opacity: 0.8,
    },

    typing: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 4,
    },
    typingText: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textTertiary,
    },

    emptyWrap: {
      alignItems: "center",
      justifyContent: "center",
      paddingTop: 40,
    },
    emptyLogoCircle: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    emptyTitle: {
      fontFamily: Typography.heading,
      fontSize: 22,
      fontWeight: "800",
      color: Colors.textPrimary,
      textAlign: "center",
    },
    emptySubtitle: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      textAlign: "center",
      marginTop: 6,
      marginBottom: Spacing.lg,
      paddingHorizontal: Spacing.lg,
      lineHeight: 20,
    },
    startBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      backgroundColor: Colors.primary,
      paddingHorizontal: Spacing.xl,
      paddingVertical: 14,
      borderRadius: 28,
      marginTop: Spacing.md,
      marginBottom: Spacing.lg,
      ...Shadow.md,
    },
    startBtnText: {
      color: "#fff",
      fontFamily: Typography.heading,
      fontSize: 16,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    suggestHeader: {
      fontFamily: Typography.body,
      fontSize: 12,
      color: Colors.textTertiary,
      textAlign: "right",
      width: "100%",
      paddingHorizontal: Spacing.md,
      marginTop: Spacing.sm,
      marginBottom: Spacing.sm,
    },
    suggestList: {
      gap: 8,
      width: "100%",
      paddingHorizontal: Spacing.md,
    },
    suggestionChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: Spacing.md,
      paddingVertical: 12,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: BorderRadius.md,
    },
    suggestionText: {
      fontFamily: Typography.body,
      fontSize: 13,
      color: Colors.textSecondary,
      flex: 1,
      textAlign: "right",
    },

    inputBar: {
      position: "absolute",
      left: Spacing.lg,
      right: Spacing.lg,
      bottom: Platform.OS === "ios" ? 100 : 90,
      flexDirection: "row",
      alignItems: "flex-end",
      gap: 8,
      backgroundColor: Colors.surface,
      borderWidth: 1,
      borderColor: Colors.border,
      borderRadius: 28,
      paddingHorizontal: Spacing.md,
      paddingVertical: 6,
      ...Shadow.md,
    },
    input: {
      flex: 1,
      fontFamily: Typography.body,
      fontSize: 14,
      color: Colors.textPrimary,
      paddingVertical: Platform.OS === "ios" ? 10 : 6,
      paddingHorizontal: 8,
      maxHeight: 120,
      minHeight: 40,
    },
    sendBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
  });
