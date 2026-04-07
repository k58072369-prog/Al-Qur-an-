import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Vibration } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, Typography, Spacing, BorderRadius, Shadow } from '../theme';
import { formatTime } from '../utils/helpers';

type TaskTimerProps = {
  initialSeconds: number;
  onFinish: () => void;
  onClose: () => void;
  title: string;
};

export function TaskTimer({ initialSeconds, onFinish, onClose, title }: TaskTimerProps) {
  const Colors = useTheme();
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: any = null;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((s) => s - 1);
      }, 1000);
    } else if (seconds === 0 && isActive) {
      setIsActive(false);
      setIsFinished(true);
      Vibration.vibrate([0, 500, 200, 500]);
      onFinish();
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.03, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive]);

  const toggle = () => setIsActive(!isActive);
  const reset = () => {
    setSeconds(initialSeconds);
    setIsActive(false);
    setIsFinished(false);
  };

  const currentProgress = initialSeconds > 0 ? (initialSeconds - seconds) / initialSeconds : 0;

  return (
    <View style={styles.overlay}>
      <View 
         
        style={[styles.container, { backgroundColor: Colors.background }]}
      >
        {/* Background Decorative Circles */}
        <View style={[styles.decorCircle, { top: -50, left: -50, backgroundColor: Colors.primarySubtle }]} />
        <View style={[styles.decorCircle, { bottom: -100, right: -50, backgroundColor: Colors.primarySubtle, width: 300, height: 300 }]} />

        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Ionicons name="close" size={28} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.title, { color: Colors.textPrimary }]}>{title}</Text>
          <View style={[styles.badge, { backgroundColor: isActive ? Colors.primaryMuted : Colors.glass }]}>
             <Text style={[styles.badgeText, { color: isActive ? Colors.primary : Colors.textTertiary }]}>
                {isActive ? 'جاري الآن' : 'متوقف'}
             </Text>
          </View>
        </View>
        
        <Animated.View style={[
          styles.timerContainer, 
          { transform: [{ scale: pulseAnim }] }
        ]}>
          <View style={[styles.progressBackground, { borderColor: Colors.borderLight }]}>
             {/* Progress simulation with shadow/border */}
             <View style={[
                styles.timerCircle, 
                { 
                  borderColor: isActive ? Colors.primary : Colors.border,
                  backgroundColor: Colors.glassElevated,
                }
              ]}>
                <Text style={[styles.timeText, { color: isFinished ? Colors.success : Colors.textPrimary }]}>
                  {formatTime(seconds)}
                </Text>
                <Text style={[styles.remainingLabel, { color: Colors.textTertiary }]}>المتبقي</Text>
              </View>
          </View>
        </Animated.View>

        <View style={styles.controls}>
          {!isFinished ? (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: isActive ? Colors.warning : Colors.primary }, Shadow.md]} 
              onPress={toggle}
            >
              <Ionicons name={isActive ? "pause" : "play"} size={24} color="#FFF" />
              <Text style={styles.btnText}>{isActive ? "إيقاف مؤقت" : "ابدأ الجلسة"}</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              activeOpacity={0.8}
              style={[styles.btn, { backgroundColor: Colors.success }, Shadow.md]} 
              onPress={onClose}
            >
              <Ionicons name="checkmark-done" size={24} color="#FFF" />
              <Text style={styles.btnText}>إكمال الورد</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.resetBtn} onPress={reset}>
            <Ionicons name="refresh" size={16} color={Colors.textTertiary} style={{ marginLeft: 6 }} />
            <Text style={[styles.resetText, { color: Colors.textTertiary }]}>إعادة ضبط الوقت</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.footer, { backgroundColor: Colors.glass, borderColor: Colors.glassBorder }]}>
          <Ionicons name="bulb-outline" size={18} color={Colors.gold} />
          <Text style={[styles.hint, { color: Colors.textSecondary }]}>
            {isActive ? "استمر في التركيز، الله يبارك في وقتك" : "اضغط ابدأ عندما تكون مستعداً للبدء"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 2000,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  decorCircle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 150,
    opacity: 0.4,
  },
  closeBtn: {
    position: 'absolute',
    top: 60,
    right: Spacing.xl,
    padding: Spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: BorderRadius.full,
  },
  header: {
    alignItems: 'center',
    marginBottom: Spacing["4xl"],
  },
  title: {
    fontFamily: Typography.heading, fontSize: Typography.xl,
    fontWeight: Typography.bold,
    marginBottom: Spacing.sm,
  },
  badge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  badgeText: {
    fontFamily: Typography.heading, fontSize: Typography.xs,
    fontWeight: Typography.semibold,
  },
  timerContainer: {
    marginBottom: Spacing["5xl"],
  },
  progressBackground: {
    width: 260,
    height: 260,
    borderRadius: 130,
    borderWidth: 8,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.lg,
  },
  timerCircle: {
    width: 230,
    height: 230,
    borderRadius: 115,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: 'System', 
    fontSize: Typography["5xl"],
    fontWeight: '200',
    letterSpacing: -1,
  },
  remainingLabel: {
    fontFamily: Typography.body, fontSize: Typography.sm,
    marginTop: -5,
  },
  controls: {
    width: '100%',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  btn: {
    width: '85%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xl,
    gap: Spacing.md,
  },
  btnText: {
    fontFamily: Typography.heading, fontSize: Typography.md,
    fontWeight: Typography.bold,
    color: '#FFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
  },
  resetText: {
    fontFamily: Typography.body, fontSize: Typography.sm,
  },
  footer: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    gap: Spacing.sm,
    maxWidth: '90%',
  },
  hint: {
    fontFamily: Typography.body, fontSize: Typography.sm,
    textAlign: 'center',
  }
});
