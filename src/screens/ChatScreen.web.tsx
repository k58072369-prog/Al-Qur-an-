// Web build of the MOTQN.ai chat screen.
// Ported directly from the provided App.tsx (Vite/React) reference files,
// with two required adaptations:
//   1) Brand logo (transparent PNG) replaces the placeholder "M" letter.
//   2) Gemini API key is read from EXPO_PUBLIC_GEMINI_API_KEY (Expo's
//      public env convention) instead of process.env.GEMINI_API_KEY.
import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Send,
  User,
  ArrowRight,
  RefreshCw,
  MessageSquare,
  Copy,
  Check,
} from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from "react-markdown";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import "./chat-web.css";

// Resolve a usable URL for the transparent brand logo on web.
// Metro/Expo Web returns either a string or { uri } depending on bundler version.
const logoModule: any = require("../../assets/images/logo_transparent.png");
const LOGO_URL: string =
  typeof logoModule === "string"
    ? logoModule
    : logoModule?.uri || logoModule?.default || "";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// --- AI initialization ---
// Required: define EXPO_PUBLIC_GEMINI_API_KEY in your environment (Replit
// Secrets, or .env). See .env.example for the placeholder.
const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY || "";
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODEL = "gemini-1.5-flash";

const SYSTEM_INSTRUCTION = `
You are MOTQN.ai, an advanced, high-end AI assistant known for precision, elegance, and deep knowledge.
Your personality is sophisticated, professional, and extremely helpful.
You speak primarily in Arabic (but can respond accurately in other languages if asked).
Your tone should be "Professional and Chic" (رسمي وعصري) - minimalist, authoritative, and respectful.
Provide concise but deep and accurate answers.
Format your responses using Markdown for better readability.
If asked for your name, you are "MOTQN.ai".
`;

function BrandMark({ size = 48, rounded = 16 }: { size?: number; rounded?: number }) {
  return (
    <div
      className="motqn-glass"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <img
        src={LOGO_URL}
        alt="MOTQN"
        style={{
          width: size * 0.7,
          height: size * 0.7,
          objectFit: "contain",
          filter: "brightness(0) invert(1)",
        }}
      />
    </div>
  );
}

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="motqn-grid-bg"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: 24,
        textAlign: "center",
      }}
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ marginBottom: 48, position: "relative" }}
      >
        <div
          className="motqn-pulse"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(255,255,255,0.08)",
            borderRadius: "9999px",
            filter: "blur(48px)",
          }}
        />
        <div
          className="motqn-glass"
          style={{
            position: "relative",
            zIndex: 10,
            width: 112,
            height: 112,
            borderRadius: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: "rotate(8deg)",
            transition: "transform .5s",
          }}
        >
          <img
            src={LOGO_URL}
            alt="MOTQN"
            style={{
              width: 70,
              height: 70,
              objectFit: "contain",
              filter: "brightness(0) invert(1)",
            }}
          />
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="motqn-display"
        style={{ fontSize: "clamp(3rem, 8vw, 6rem)", margin: "0 0 24px 0" }}
      >
        MOTQN.ai
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: "1.125rem",
          maxWidth: 560,
          margin: "0 0 48px 0",
          fontWeight: 300,
          lineHeight: 1.7,
          padding: "0 16px",
        }}
      >
        مستقبلك يبدأ هنا. تجربة ذكاء اصطناعي رسمية صُممت لأجلك، حيث تلتقي
        الدقة بالفخامة في كل إجابة.
      </motion.p>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "20px 48px",
          background: "#fff",
          color: "#0A0A0A",
          borderRadius: 18,
          fontWeight: 600,
          letterSpacing: "0.02em",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 10px 40px rgba(0,0,0,0.4)",
          fontSize: 16,
        }}
      >
        ابدأ التجربة
        <ArrowRight style={{ width: 20, height: 20 }} />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        style={{
          position: "absolute",
          bottom: 40,
          color: "rgba(255,255,255,0.15)",
          fontSize: 10,
          fontFamily: "monospace",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
        }}
      >
        Performance • Intelligence • Design
      </motion.div>
    </motion.div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      style={{
        display: "flex",
        width: "100%",
        marginBottom: 32,
        justifyContent: isAssistant ? "flex-start" : "flex-end",
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 16,
          maxWidth: "85%",
          flexDirection: isAssistant ? "row" : "row-reverse",
          textAlign: isAssistant ? "start" : "right",
        }}
      >
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: 12,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
            border: "1px solid rgba(255,255,255,0.1)",
            background: isAssistant ? "#fff" : "rgba(255,255,255,0.06)",
            color: isAssistant ? "#0A0A0A" : "#fff",
          }}
        >
          {isAssistant ? (
            <img
              src={LOGO_URL}
              alt="M"
              style={{
                width: 22,
                height: 22,
                objectFit: "contain",
                filter: "brightness(0)",
              }}
            />
          ) : (
            <User style={{ width: 18, height: 18 }} />
          )}
        </div>

        <div className="motqn-bubble-group" style={{ position: "relative" }}>
          <div
            className={cn(
              isAssistant ? "motqn-bubble-assistant" : "motqn-bubble-user"
            )}
            style={{
              padding: "16px 22px",
              borderRadius: 22,
              fontSize: "1rem",
              transition: "all .3s",
            }}
          >
            {isAssistant ? (
              <div className="motqn-markdown">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, margin: 0 }}>
                {message.content}
              </p>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginTop: 12,
                gap: 24,
                paddingTop: 8,
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.45,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  fontFamily: "monospace",
                  color: isAssistant
                    ? "rgba(255,255,255,0.4)"
                    : "rgba(0,0,0,0.4)",
                }}
              >
                {message.timestamp.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>

              {isAssistant && message.content && (
                <button
                  onClick={handleCopy}
                  title="نسخ المحتوى"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: 6,
                    background: "transparent",
                    border: "none",
                    borderRadius: 8,
                    cursor: "pointer",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        style={{ display: "flex", alignItems: "center", gap: 6 }}
                      >
                        <Check style={{ width: 14, height: 14, color: "#fff" }} />
                        <span
                          style={{
                            fontSize: 10,
                            textTransform: "uppercase",
                            fontFamily: "monospace",
                            color: "#fff",
                          }}
                        >
                          Copied
                        </span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Copy style={{ width: 14, height: 14 }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ChatScreenWeb() {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!API_KEY) {
      const warn: Message = {
        id: Date.now().toString(),
        role: "assistant",
        content:
          "⚠️ مفتاح Gemini API غير مُهيأ. يرجى تعيين المتغير `EXPO_PUBLIC_GEMINI_API_KEY` في إعدادات البيئة (.env) ثم إعادة تشغيل التطبيق.",
        timestamp: new Date(),
      };
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() - 1).toString(),
          role: "user",
          content: input.trim(),
          timestamp: new Date(),
        },
        warn,
      ]);
      setInput("");
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    const assistantMessageId = (Date.now() + 1).toString();
    const newAssistantMessage: Message = {
      id: assistantMessageId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    };

    try {
      const contents = messages.map((msg) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      }));
      contents.push({ role: "user", parts: [{ text: userMessage.content }] });

      setMessages((prev) => [...prev, newAssistantMessage]);

      const result = await ai.models.generateContentStream({
        model: MODEL,
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      let fullText = "";
      for await (const chunk of result) {
        const chunkText = chunk.text || "";
        fullText += chunkText;
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMessageId ? { ...msg, content: fullText } : msg
          )
        );
      }
    } catch (error) {
      console.error("AI Error:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content:
                  "للأسف، واجهت مشكلة في الاتصال بمزود الخدمة. يرجى المحاولة مرة أخرى.",
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="motqn-root motqn-grid-bg"
      style={{ overflow: "hidden" }}
    >
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <LandingScreen key="landing" onStart={() => setHasStarted(true)} />
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: "flex",
              flexDirection: "column",
              height: "100vh",
              maxWidth: 1024,
              margin: "0 auto",
              borderInline: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(10,10,10,0.6)",
              backdropFilter: "blur(48px)",
            }}
          >
            {/* Header */}
            <header
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 24,
                borderBottom: "1px solid rgba(255,255,255,0.05)",
                position: "sticky",
                top: 0,
                zIndex: 20,
                background: "rgba(10,10,10,0.6)",
                backdropFilter: "blur(48px)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <BrandMark size={48} rounded={16} />
                <div>
                  <h2
                    className="motqn-display"
                    style={{
                      fontSize: "1.5rem",
                      margin: 0,
                      fontWeight: 700,
                    }}
                  >
                    MOTQN.ai
                  </h2>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}
                  >
                    <span
                      style={{
                        display: "block",
                        width: 8,
                        height: 8,
                        background: "#10b981",
                        borderRadius: "9999px",
                      }}
                    />
                    <span
                      style={{
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.3em",
                        color: "rgba(255,255,255,0.45)",
                        fontFamily: "monospace",
                      }}
                    >
                      Precision Online
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMessages([])}
                title="تصفير المحادثة"
                style={{
                  padding: 12,
                  borderRadius: 16,
                  background: "transparent",
                  border: "1px solid rgba(255,255,255,0.06)",
                  color: "rgba(255,255,255,0.5)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <RefreshCw style={{ width: 18, height: 18 }} />
              </button>
            </header>

            {/* Chat area */}
            <main
              ref={scrollRef}
              className="motqn-scroll"
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "24px clamp(16px, 4vw, 48px)",
                scrollBehavior: "smooth",
              }}
            >
              {messages.length === 0 ? (
                <div
                  style={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    textAlign: "center",
                    opacity: 0.55,
                    userSelect: "none",
                    gap: 32,
                    maxWidth: 640,
                    margin: "0 auto",
                  }}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      padding: 40,
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 48,
                      background: "rgba(255,255,255,0.02)",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    <MessageSquare
                      style={{ width: 64, height: 64, strokeWidth: 1 }}
                    />
                  </motion.div>
                  <p
                    className="motqn-display"
                    style={{
                      fontSize: "clamp(2rem, 5vw, 3rem)",
                      fontWeight: 700,
                      margin: 0,
                      lineHeight: 1.2,
                    }}
                  >
                    كيف يمكنني خدمتك اليوم؟
                  </p>
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    {[
                      "تحليل بيانات",
                      "كتابة محتوى إبداعي",
                      "حل مشكلات تقنية",
                      "تخطيط أعمال",
                    ].map((tag) => (
                      <button
                        key={tag}
                        onClick={() => setInput(tag)}
                        className="motqn-glass"
                        style={{
                          padding: "8px 18px",
                          borderRadius: 9999,
                          fontSize: 12,
                          fontFamily: "monospace",
                          textTransform: "uppercase",
                          letterSpacing: "0.2em",
                          color: "rgba(255,255,255,0.5)",
                          cursor: "pointer",
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)
              )}
              {isLoading &&
                !messages[messages.length - 1]?.content && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      gap: 16,
                      alignItems: "flex-start",
                    }}
                  >
                    <div
                      style={{
                        flexShrink: 0,
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        background: "#fff",
                        color: "#0A0A0A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={LOGO_URL}
                        alt="M"
                        style={{
                          width: 22,
                          height: 22,
                          objectFit: "contain",
                          filter: "brightness(0)",
                        }}
                      />
                    </div>
                    <div
                      className="motqn-glass"
                      style={{
                        padding: "16px 28px",
                        borderRadius: 28,
                        fontSize: 14,
                        color: "rgba(255,255,255,0.55)",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <span
                        className="motqn-dot delay1"
                        style={{
                          width: 6,
                          height: 6,
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: 9999,
                        }}
                      />
                      <span
                        className="motqn-dot delay2"
                        style={{
                          width: 6,
                          height: 6,
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: 9999,
                        }}
                      />
                      <span
                        className="motqn-dot"
                        style={{
                          width: 6,
                          height: 6,
                          background: "rgba(255,255,255,0.5)",
                          borderRadius: 9999,
                        }}
                      />
                      المعالج الذكي يعمل بدقة...
                    </div>
                  </motion.div>
                )}
            </main>

            {/* Input area */}
            <footer
              style={{
                padding: "20px clamp(16px, 4vw, 40px)",
                background: "rgba(10,10,10,0.7)",
                backdropFilter: "blur(16px)",
                borderTop: "1px solid rgba(255,255,255,0.05)",
              }}
            >
              <div
                style={{
                  position: "relative",
                  maxWidth: 896,
                  margin: "0 auto",
                }}
              >
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="أدخل رسالتك هنا..."
                  rows={1}
                  style={{
                    width: "100%",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "#fff",
                    borderRadius: 28,
                    padding: "20px 64px 20px 24px",
                    outline: "none",
                    resize: "none",
                    minHeight: 64,
                    maxHeight: 192,
                    fontSize: 16,
                    lineHeight: 1.6,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  style={{
                    position: "absolute",
                    insetInlineStart: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    border: "none",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
                    background:
                      input.trim() && !isLoading
                        ? "#fff"
                        : "rgba(255,255,255,0.1)",
                    color:
                      input.trim() && !isLoading
                        ? "#0A0A0A"
                        : "rgba(255,255,255,0.25)",
                    transition: "all .2s",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                  }}
                >
                  <Send style={{ width: 20, height: 20 }} />
                </button>
              </div>
              <p
                style={{
                  textAlign: "center",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.15)",
                  margin: "16px 0 0 0",
                  textTransform: "uppercase",
                  letterSpacing: "0.3em",
                  fontWeight: 500,
                }}
              >
                Official AI Interface • Powering Innovation
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
