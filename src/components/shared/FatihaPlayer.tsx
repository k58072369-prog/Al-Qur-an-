import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Shadow, Typography, useTheme } from "../../theme";

const FATIHA_AUDIO = require("../../../assets/audio/al-fatiha.mp3");

interface FatihaPlayerProps {
  autoplayDelayMs?: number;
}

export const FatihaPlayer = ({ autoplayDelayMs = 800 }: FatihaPlayerProps) => {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const soundRef = useRef<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    const setup = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          FATIHA_AUDIO,
          { shouldPlay: false, volume: 0.85 },
        );
        if (cancelled) {
          await sound.unloadAsync();
          return;
        }
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status: any) => {
          if (!status.isLoaded) return;
          if (status.didJustFinish) {
            setIsPlaying(false);
            setIsFinished(true);
            // Auto-hide the floating control a moment after the recitation ends.
            setTimeout(() => setIsVisible(false), 1500);
          }
        });

        // Small delay then attempt autoplay.
        await new Promise((r) => setTimeout(r, autoplayDelayMs));
        if (cancelled) return;
        try {
          await sound.playAsync();
          setIsPlaying(true);
        } catch {
          // Browsers may block autoplay until user gesture; user can tap play.
          setIsPlaying(false);
        }
      } catch (e) {
        console.warn("[FatihaPlayer] Failed to load audio:", e);
      }
    };

    setup();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    return () => {
      cancelled = true;
      const s = soundRef.current;
      soundRef.current = null;
      if (s) {
        s.setOnPlaybackStatusUpdate(null);
        s.unloadAsync().catch(() => {});
      }
    };
  }, []);

  // Subtle pulse while playing.
  useEffect(() => {
    if (!isPlaying) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isPlaying]);

  const togglePlay = async () => {
    const s = soundRef.current;
    if (!s) return;
    try {
      if (isPlaying) {
        await s.pauseAsync();
        setIsPlaying(false);
      } else {
        if (isFinished) {
          await s.setPositionAsync(0);
          setIsFinished(false);
        }
        await s.playAsync();
        setIsPlaying(true);
      }
    } catch (e) {
      console.warn("[FatihaPlayer] toggle failed:", e);
    }
  };

  const dismiss = async () => {
    const s = soundRef.current;
    if (s) {
      try {
        await s.stopAsync();
      } catch {}
    }
    setIsPlaying(false);
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      style={[
        styles.wrapper,
        { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.pill}>
        <TouchableOpacity
          style={styles.dismissBtn}
          onPress={dismiss}
          accessibilityLabel="إخفاء مشغل سورة الفاتحة"
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="close" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>

        <View style={styles.textBlock}>
          <Text style={styles.title}>سورة الفاتحة</Text>
          <Text style={styles.subtitle}>
            {isPlaying
              ? "جاري التلاوة..."
              : isFinished
                ? "تمت التلاوة"
                : "اضغط للتشغيل"}
          </Text>
        </View>

        <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
          <TouchableOpacity
            style={styles.playBtn}
            onPress={togglePlay}
            activeOpacity={0.85}
            accessibilityLabel={isPlaying ? "إيقاف الفاتحة" : "تشغيل الفاتحة"}
          >
            <Ionicons
              name={isPlaying ? "pause" : "play"}
              size={20}
              color="#FFFFFF"
              style={isPlaying ? undefined : { marginLeft: 2 }}
            />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const getStyles = (Colors: any) =>
  StyleSheet.create({
    wrapper: {
      position: "absolute",
      top: Platform.OS === "ios" ? 56 : 36,
      alignSelf: "center",
      left: 16,
      right: 16,
      alignItems: "center",
      zIndex: 900,
    },
    pill: {
      flexDirection: "row-reverse",
      alignItems: "center",
      gap: 12,
      paddingVertical: 8,
      paddingHorizontal: 10,
      paddingRight: 14,
      borderRadius: 999,
      backgroundColor: Colors.surfaceElevated,
      borderWidth: 1,
      borderColor: `${Colors.primary}33`,
      ...Shadow.md,
    },
    textBlock: {
      alignItems: "flex-end",
      minWidth: 110,
    },
    title: {
      fontFamily: Typography.heading,
      fontSize: 12,
      fontWeight: "700",
      color: Colors.textPrimary,
    },
    subtitle: {
      fontFamily: Typography.body,
      fontSize: 10,
      color: Colors.primary,
      marginTop: 1,
    },
    playBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...Shadow.emerald,
    },
    dismissBtn: {
      width: 24,
      height: 24,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: Colors.glass,
      borderWidth: 1,
      borderColor: Colors.glassBorder,
    },
  });

export default FatihaPlayer;
