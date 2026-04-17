import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BorderRadius, Shadow, Spacing, Typography, useTheme } from "../../theme";

interface VerseAudio {
  verse_key: string;
  url: string;
  text?: string;
}

interface AudioPlayerProps {
  visible: boolean;
  pages: number[];
  title: string;
  onClose: () => void;
}

export const AudioPlayer = ({
  visible,
  pages,
  title,
  onClose,
}: AudioPlayerProps) => {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playlist, setPlaylist] = useState<VerseAudio[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");

  const soundRef = useRef<Audio.Sound | null>(null);
  const isChangingTrackRef = useRef(false);
  const currentIndexRef = useRef(0);
  const trackToPlayRef = useRef("");

  const updateCurrentIndex = (idx: number) => {
    currentIndexRef.current = idx;
    setCurrentIndex(idx);
  };

  useEffect(() => {
    if (visible && pages.length > 0) {
      loadPlaylist();
    } else {
      shutdownPlayer();
    }
    return () => {
      shutdownPlayer();
    };
  }, [visible, pages]);

  const loadPlaylist = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
      });

      let allVerses: VerseAudio[] = [];
      for (const page of pages) {
        const [resAudio, resText] = await Promise.all([
          fetch(`https://api.quran.com/api/v4/recitations/6/by_page/${page}`),
          fetch(
            `https://api.quran.com/api/v4/quran/verses/uthmani?page_number=${page}`,
          ),
        ]);

        if (resAudio.ok && resText.ok) {
          const dataAudio = await resAudio.json();
          const dataText = await resText.json();

          const textMap = new Map<string, string>();
          dataText.verses.forEach((v: any) => {
            textMap.set(v.verse_key, v.text_uthmani);
          });

          const combined = dataAudio.audio_files.map((a: any) => ({
            ...a,
            text: textMap.get(a.verse_key) || "—",
          }));

          allVerses = [...allVerses, ...combined];
        }
      }

      if (allVerses.length > 0) {
        setPlaylist(allVerses);
        updateCurrentIndex(0);
        await playTrackIndex(0, allVerses);
      } else {
        setErrorMsg("لا توجد تلاوات متاحة لهذه الصفحات.");
      }
    } catch (e) {
      console.error("Failed to load audio:", e);
      setErrorMsg("حدث خطأ أثناء جلب المقاطع الصوتية.");
    } finally {
      setIsLoading(false);
    }
  };

  const playTrackIndex = async (index: number, versesList = playlist) => {
    if (isChangingTrackRef.current) return;

    const verse = versesList[index];
    if (!verse) return;

    isChangingTrackRef.current = true;
    updateCurrentIndex(index);
    trackToPlayRef.current = verse.url;
    setIsPlaying(false);

    try {
      if (soundRef.current) {
        soundRef.current.setOnPlaybackStatusUpdate(null);
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      const url = verse.url.startsWith("//") ? `https:${verse.url}` : verse.url;
      const { sound } = await Audio.Sound.createAsync(
        { uri: url },
        { shouldPlay: true },
      );

      // Verify we haven't skipped this track while it was loading
      if (trackToPlayRef.current !== verse.url || !visible) {
        await sound.unloadAsync();
        return;
      }

      soundRef.current = sound;
      soundRef.current.setOnPlaybackStatusUpdate(onPlaybackStatusUpdate);
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing track:", error);
    } finally {
      isChangingTrackRef.current = false;
    }
  };

  const onPlaybackStatusUpdate = (status: any) => {
    if (status.isLoaded && status.didJustFinish) {
      setTimeout(() => playNext(), 50);
    }
  };

  const playNext = async () => {
    const nextIdx = currentIndexRef.current + 1;
    if (nextIdx < playlist.length) {
      await playTrackIndex(nextIdx);
    } else {
      setIsPlaying(false);
      updateCurrentIndex(0);
    }
  };

  const playPrevious = async () => {
    const prevIdx =
      currentIndexRef.current > 0 ? currentIndexRef.current - 1 : 0;
    await playTrackIndex(prevIdx);
  };

  const togglePlayPause = async () => {
    if (isChangingTrackRef.current) return;
    if (soundRef.current) {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } else if (playlist.length > 0) {
      playTrackIndex(currentIndexRef.current);
    }
  };

  const shutdownPlayer = async () => {
    trackToPlayRef.current = "";
    if (soundRef.current) {
      soundRef.current.setOnPlaybackStatusUpdate(null);
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
    setIsPlaying(false);
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={28} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.content}>
            {(isLoading || errorMsg) && (
              <View style={styles.iconContainer}>
                <Ionicons name="headset" size={60} color={Colors.primary} />
              </View>
            )}

            <Text style={styles.title}>{title}</Text>
            {(isLoading || errorMsg) && (
              <Text style={styles.subtitle}>تلاوة الشيخ محمود خليل الحصري</Text>
            )}

            {isLoading ? (
              <View style={styles.loaderArea}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>جاري التحميل...</Text>
              </View>
            ) : errorMsg ? (
              <Text style={styles.errorText}>{errorMsg}</Text>
            ) : (
              <View style={styles.playerArea}>
                <ScrollView
                  style={styles.textScrollView}
                  contentContainerStyle={styles.textScrollContent}
                  showsVerticalScrollIndicator={true}
                >
                  <Text style={styles.ayahTextUthmani}>
                    {playlist[currentIndex]?.text}
                  </Text>
                  <Text style={styles.ayahText}>
                    الآية: {playlist[currentIndex]?.verse_key}
                  </Text>
                </ScrollView>

                <Text style={styles.progressText}>
                  {currentIndex + 1} / {playlist.length} مقطع
                </Text>

                <View style={styles.controls}>
                  {/* Next Button -> Points left in Arabic context */}
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={playNext}
                    disabled={currentIndex === playlist.length - 1}
                  >
                    <Ionicons
                      name="play-skip-back"
                      size={36}
                      color={
                        currentIndex === playlist.length - 1
                          ? Colors.textTertiary
                          : Colors.textPrimary
                      }
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.playPauseBtn}
                    onPress={togglePlayPause}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={48}
                      color="#FFF"
                    />
                  </TouchableOpacity>

                  {/* Previous Button -> Points right in Arabic context */}
                  <TouchableOpacity
                    style={styles.controlBtn}
                    onPress={playPrevious}
                    disabled={currentIndex === 0}
                  >
                    <Ionicons
                      name="play-skip-forward"
                      size={36}
                      color={
                        currentIndex === 0
                          ? Colors.textTertiary
                          : Colors.textPrimary
                      }
                    />
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const getStyles = (Colors: any) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    container: {
      backgroundColor: Colors.surface,
      borderTopLeftRadius: BorderRadius.xl,
      borderTopRightRadius: BorderRadius.xl,
      height: "85%",
      ...Shadow.lg,
    },
    closeBtn: {
      alignSelf: "flex-end",
      padding: Spacing.md,
    },
    content: {
      alignItems: "center",
      padding: Spacing.xl,
      flex: 1,
    },
    iconContainer: {
      width: 100,
      height: 100,
      borderRadius: 50,
      backgroundColor: `${Colors.primary}20`,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: Spacing.lg,
    },
    title: {
      fontFamily: Typography.heading,
      fontSize: Typography.xl,
      fontWeight: Typography.bold,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: Spacing.xs,
    },
    subtitle: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.textSecondary,
      textAlign: "center",
      marginBottom: Spacing.xl,
    },
    loaderArea: {
      alignItems: "center",
      gap: Spacing.md,
      marginTop: Spacing.lg,
    },
    loaderText: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textSecondary,
    },
    errorText: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.error,
      textAlign: "center",
      marginTop: Spacing.lg,
    },
    playerArea: {
      width: "100%",
      alignItems: "center",
      flex: 1,
    },
    textScrollView: {
      width: "100%",
      flex: 1,
      marginBottom: Spacing.md,
    },
    textScrollContent: {
      alignItems: "center",
      paddingBottom: Spacing.md,
    },
    ayahTextUthmani: {
      fontFamily: Typography.quran,
      fontSize: 28,
      color: Colors.textPrimary,
      textAlign: "center",
      marginBottom: Spacing.md,
      lineHeight: 50,
    },
    ayahText: {
      fontFamily: Typography.body,
      fontSize: Typography.base,
      color: Colors.textSecondary,
      marginBottom: Spacing.sm,
    },
    progressText: {
      fontFamily: Typography.body,
      fontSize: Typography.sm,
      color: Colors.textTertiary,
      marginBottom: Spacing.xl,
    },
    controls: {
      flexDirection: "row-reverse",
      alignItems: "center",
      justifyContent: "center",
      gap: Spacing.xl,
    },
    controlBtn: {
      padding: Spacing.sm,
    },
    playPauseBtn: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: Colors.primary,
      alignItems: "center",
      justifyContent: "center",
      ...Shadow.md,
    },
  });
