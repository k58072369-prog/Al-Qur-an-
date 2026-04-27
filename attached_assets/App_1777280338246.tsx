import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, User, Bot, ArrowRight, RefreshCw, MessageSquare, Copy, Check } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import ReactMarkdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for Tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const model = "gemini-3-flash-preview";

const SYSTEM_INSTRUCTION = `
You are MOTQN.ai, an advanced, high-end AI assistant known for precision, elegance, and deep knowledge.
Your personality is sophisticated, professional, and extremely helpful.
You speak primarily in Arabic (but can respond accurately in other languages if asked).
Your tone should be "Professional and Chic" (رسمي وعصري) - minimalist, authoritative, and respectful.
Provide concise but deep and accurate answers.
Format your responses using Markdown for better readability.
If asked for your name, you are "MOTQN.ai".
`;

// --- Components ---

function LandingScreen({ onStart }: { onStart: () => void }) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center min-h-screen p-6 text-center grid-bg"
    >
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="mb-12 relative"
      >
        <div className="absolute inset-0 bg-brand-white/5 rounded-full blur-3xl animate-pulse" />
        <div className="relative z-10 w-28 h-28 glass rounded-3xl flex items-center justify-center border-brand-white/10 rotate-12 hover:rotate-0 transition-transform duration-500">
           <span className="text-4xl font-display font-bold text-brand-white">M</span>
        </div>
      </motion.div>

      <motion.h1
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-6xl md:text-8xl font-display font-bold mb-6 tracking-tighter text-brand-white"
      >
        MOTQN.ai
      </motion.h1>

      <motion.p
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-brand-white/50 text-lg md:text-xl max-w-xl mb-12 font-light leading-relaxed px-4"
      >
        مستقبلك يبدأ هنا. تجربة ذكاء اصطناعي رسمية صُممت لأجلك، حيث تلتقي الدقة بالفخامة في كل إجابة.
      </motion.p>

      <motion.button
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={onStart}
        className="group relative flex items-center gap-4 px-12 py-5 bg-brand-white text-brand-black rounded-2xl font-semibold tracking-wide transition-all shadow-[0_10px_40px_rgba(0,0,0,0.15)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.25)]"
      >
        ابدأ التجربة
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      </motion.button>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="absolute bottom-10 text-brand-white/10 text-[10px] font-mono uppercase tracking-[0.5em]"
      >
        Performance • Intelligence • Design
      </motion.div>
    </motion.div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isAssistant = message.role === 'assistant';
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "flex w-full mb-8 group/message",
        isAssistant ? "justify-start" : "justify-end"
      )}
    >
      <div className={cn(
        "flex max-w-[90%] md:max-w-[75%] gap-4",
        !isAssistant && "flex-row-reverse text-right"
      )}>
        <div className={cn(
          "flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border mt-1 shadow-sm transition-transform duration-300 hover:scale-110",
          isAssistant ? "bg-brand-white text-brand-black border-brand-white/30" : "bg-brand-gray-800 text-brand-white border-brand-white/10"
        )}>
          {isAssistant ? <span className="font-display font-bold text-sm">M</span> : <User className="w-5 h-5" />}
        </div>
        
        <div className="relative group/bubble">
          <div className={cn(
            "px-6 py-4 rounded-[1.5rem] text-[1.05rem] transition-all duration-300",
            isAssistant 
              ? "chat-bubble-assistant" 
              : "chat-bubble-user"
          )}>
            {isAssistant ? (
              <div className="markdown-body">
                <ReactMarkdown>{message.content}</ReactMarkdown>
              </div>
            ) : (
              <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
            
            <div className="flex items-center justify-between mt-3 gap-6 pt-2 border-t border-brand-white/5">
              <span className={cn(
                "text-[10px] opacity-40 uppercase tracking-widest font-mono",
                isAssistant ? "text-brand-white/40" : "text-brand-black/40"
              )}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {isAssistant && message.content && (
                <button
                  onClick={handleCopy}
                  className="opacity-0 group-hover/bubble:opacity-100 transition-opacity p-1.5 hover:bg-white/10 rounded-lg text-brand-white/40 hover:text-brand-white flex items-center gap-1.5"
                  title="نسخ المحتوى"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5 text-brand-white" />
                        <span className="text-[10px] uppercase font-mono text-brand-white">Copied</span>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                      >
                        <Copy className="w-4 h-4" />
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

export default function App() {
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Placeholder for assistant message in the list
    const assistantMessageId = (Date.now() + 1).toString();
    const newAssistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
    };

    try {
      const contents = messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));
      
      contents.push({ role: 'user', parts: [{ text: userMessage.content }] });

      setMessages(prev => [...prev, newAssistantMessage]);

      const result = await ai.models.generateContentStream({
        model: model,
        contents: contents,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
        }
      });

      let fullText = "";
      for await (const chunk of result) {
        const chunkText = chunk.text;
        fullText += chunkText;
        
        // Update the specifically created assistant message
        setMessages(prev => prev.map(msg => 
          msg.id === assistantMessageId 
            ? { ...msg, content: fullText } 
            : msg
        ));
      }

    } catch (error) {
      console.error("AI Error:", error);
      setMessages(prev => prev.map(msg => 
        msg.id === assistantMessageId 
          ? { ...msg, content: "للأسف، واجهت مشكلة في الاتصال بمزود الخدمة. يرجى المحاولة مرة أخرى." } 
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black overflow-hidden selection:bg-brand-white selection:text-brand-black grid-bg">
      <AnimatePresence mode="wait">
        {!hasStarted ? (
          <LandingScreen key="landing" onStart={() => setHasStarted(true)} />
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col h-screen max-w-5xl mx-auto border-x border-brand-white/5 bg-brand-black/40 backdrop-blur-3xl"
          >
            {/* Header */}
            <header className="flex items-center justify-between p-6 bg-brand-black/40 backdrop-blur-3xl border-b border-brand-white/5 sticky top-0 z-20 official-gradient">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 glass rounded-2xl flex items-center justify-center border-brand-white/10 shadow-2xl transition-transform hover:scale-105">
                  <span className="font-display font-bold text-2xl text-brand-white">M</span>
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold tracking-tight text-brand-white">MOTQN.ai</h2>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute inset-0 w-2 h-2 bg-emerald-500 rounded-full animate-ping opacity-50" />
                      <span className="relative block w-2 h-2 bg-emerald-500 rounded-full" />
                    </div>
                    <span className="text-[10px] uppercase tracking-[0.3em] text-brand-white/40 font-mono">Precision Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setMessages([])}
                  className="p-3 hover:bg-brand-white/5 rounded-2xl transition-all text-brand-white/20 hover:text-brand-white active:scale-90 border border-transparent hover:border-brand-white/10"
                  title="تصفير المحادثة"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </header>

            {/* Chat Area */}
            <main 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 md:p-12 space-y-4 scroll-smooth"
            >
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40 select-none space-y-8 max-w-2xl mx-auto">
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-10 border border-brand-white/5 rounded-[3rem] bg-brand-white/[0.02] backdrop-blur-sm"
                  >
                    <MessageSquare className="w-16 h-16 stroke-[1px] text-brand-white" />
                  </motion.div>
                  <p className="font-display text-5xl font-bold tracking-tight text-brand-white leading-tight">كيف يمكنني خدمتك اليوم؟</p>
                  <div className="flex flex-wrap justify-center gap-3">
                    {['تحليل بيانات', 'كتابة محتوى إبداعي', 'حل مشكلات تقنية', 'تخطيط أعمال'].map((tag) => (
                      <span key={tag} className="px-5 py-2 glass rounded-full text-xs font-mono uppercase tracking-widest text-brand-white/40">{tag}</span>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map(msg => (
                  <ChatMessage key={msg.id} message={msg} />
                ))
              )}
              {isLoading && !messages[messages.length-1]?.content && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start gap-5 items-start"
                >
                  <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center border bg-brand-white text-brand-black animate-pulse shadow-2xl">
                    <span className="font-display font-bold text-sm">M</span>
                  </div>
                  <div className="glass px-8 py-5 rounded-[2rem] border-brand-white/5 text-sm text-brand-white/50 font-medium flex items-center gap-3">
                    <span className="w-1.5 h-1.5 bg-brand-white/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-brand-white/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-brand-white/40 rounded-full animate-bounce" />
                    المعالج الذكي يعمل بدقة...
                  </div>
                </motion.div>
              )}
            </main>

            {/* Input Area */}
            <footer className="p-6 md:p-10 bg-brand-black/60 backdrop-blur-md border-t border-brand-white/5">
              <div className="relative group max-w-4xl mx-auto">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="أدخل رسالتك هنا..."
                  className="w-full bg-brand-white/5 border border-brand-white/10 text-brand-white rounded-[2rem] pl-8 pr-16 py-6 focus:outline-none focus:border-brand-white/30 transition-all resize-none min-h-[76px] max-h-48 placeholder:text-brand-white/10 leading-relaxed text-lg"
                  rows={1}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl",
                    input.trim() && !isLoading 
                      ? "bg-brand-white text-brand-black hover:scale-105 active:scale-95" 
                      : "bg-brand-white/10 text-brand-white/20 cursor-not-allowed"
                  )}
                >
                  <Send className="w-6 h-6 ml-0.5" />
                </button>
              </div>
              <p className="text-center text-[10px] text-brand-white/10 mt-6 uppercase tracking-[0.3em] font-medium">
                Official AI Interface • Powering Innovation
              </p>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
