import { Amiri_400Regular } from "@expo-google-fonts/amiri";
import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  useFonts,
} from "@expo-google-fonts/tajawal";
import { Ionicons } from "@expo/vector-icons";
import { Stack, usePathname } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  I18nManager,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import "../global.css";
import FatihaPlayer from "../src/components/shared/FatihaPlayer";
import VersionOverlay from "../src/components/shared/VersionOverlay";
import { AppProvider } from "../src/store/AppStore";
import { UpdateInfo, UpdateService } from "../src/store/UpdateService";
import { Spacing, Typography, useTheme } from "../src/theme";

// Force RTL for Arabic
I18nManager.allowRTL(true);
I18nManager.forceRTL(true);

const { width, height } = Dimensions.get("window");

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);

  // Load actual fonts to ensure fontsLoaded becomes true correctly
  const [fontsLoaded] = useFonts({
    Tajawal_400Regular,
    Tajawal_500Medium,
    Tajawal_700Bold,
    Amiri_400Regular,
    ...Ionicons.font,
  });

  useEffect(() => {
    async function prepare() {
      try {
        // Removed stats
        // Just a small delay to ensure everything is mounted
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (e) {
        console.warn("[RootLayout] Initialization tasks failed:", e);
      } finally {
        // Reveal the app as soon as fonts are ready
        setAppIsReady(true);
      }
    }

    if (fontsLoaded) {
      prepare();
    }
  }, [fontsLoaded]);

  const onFinish = useCallback(() => {
    setShowCustomSplash(false);
  }, []);

  if (!appIsReady || !fontsLoaded) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#07090F",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />
      </View>
    );
  }

  return (
    <AppProvider>
      <MainLayout showCustomSplash={showCustomSplash} onFinish={onFinish} />
    </AppProvider>
  );
}

function MainLayout({
  showCustomSplash,
  onFinish,
}: {
  showCustomSplash: boolean;
  onFinish: () => void;
}) {
  const Colors = useTheme();
  const pathname = usePathname();

  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [blockType, setBlockType] = useState<
    "disabled" | "force_update" | "optional_update" | null
  >(null);

  const checkVersion = useCallback(async () => {
    try {
      const info = await UpdateService.checkForUpdate();
      if (info) {
        setUpdateInfo(info);
        if (info.isAppDisabled) setBlockType("disabled");
        else if (info.isMandatory) setBlockType("force_update");
        else if (info.hasUpdate) setBlockType("optional_update");
        else setBlockType(null);
      }
    } catch (err) {
      console.warn("[RootLayout] Update check failed:", err);
    }
  }, []);

  useEffect(() => {
    checkVersion();

    // Global Status Polling: Only poll for updates if the app is currently showing a blocking overlay.
    // Otherwise, it only checks on app start.
    if (blockType === "disabled" || blockType === "force_update") {
      const interval = setInterval(checkVersion, 45000);
      return () => clearInterval(interval);
    }
  }, [checkVersion, blockType]);

  // Track page views removed
  useEffect(() => {
    // Stats removed
  }, [pathname]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar
        barStyle={
          Colors.background === "#07090F" ? "light-content" : "dark-content"
        }
        translucent
        backgroundColor="transparent"
      />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      {!showCustomSplash && <FatihaPlayer />}
      {showCustomSplash && <CustomSplashScreen onFinish={onFinish} />}

      {updateInfo && blockType && (
        <VersionOverlay
          type={blockType}
          info={updateInfo}
          onDismiss={() => setBlockType(null)}
          onRefresh={checkVersion}
        />
      )}
    </View>
  );
}

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const Colors = useTheme();
  const styles = React.useMemo(() => getStyles(Colors), [Colors]);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const exitAnim = useRef(new Animated.Value(1)).current;
  const starAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry & Progress
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: false,
      }),
    ]).start();

    Animated.timing(starAnim, {
      toValue: 1,
      duration: 600,
      delay: 600,
      useNativeDriver: true,
    }).start();

    // Exit phase
    const timer = setTimeout(() => {
      Animated.timing(exitAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onFinish();
      });
    }, 3200);

    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  return (
    <Animated.View style={[styles.splash, { opacity: exitAnim }]}>
      <View style={StyleSheet.absoluteFill} />

      {/* Background Decor */}
      <View style={styles.splashOrb1} />
      <View style={styles.splashOrb2} />

      <View style={styles.centerContent}>
        {/* Logo Section */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Image
            source={require("../assets/images/motqn_logo.png")}
            style={styles.logoImageSplash}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Dedication: ongoing charity for the developer's late father */}
        <Animated.View style={[styles.textBlock, { opacity: fadeAnim }]}>
          <View style={styles.dedicationDivider} />
          <Text style={styles.dedicationLabel}>صدقة جارية</Text>
          <Text style={styles.dedicationText}>
            على روح والدي المهندس أيمن مبروك ريان
          </Text>
          <Text style={styles.dedicationDua}>تقبّل الله منه ورحمه</Text>
        </Animated.View>

        {/* Progress Bar Section */}
        <View style={[styles.loadingContainer, { width: 100 }]}>
          <Animated.View
            style={[
              styles.sleekLineFill,
              {
                width: progressWidth,
              },
            ]}
          />
        </View>
      </View>

      {/* Bottom Quote */}
      <Animated.View style={[styles.bottomQuote, { opacity: starAnim }]}>
        <Text style={styles.quoteText}>اقرأ وارقَ ورتِّل</Text>
      </Animated.View>
    </Animated.View>
  );
}

const getStyles = (Colors: any) =>
  StyleSheet.create({
    splash: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: Colors.background,
      alignItems: "center",
      justifyContent: "center",
      zIndex: 1000,
    },
    splashOrb1: {
      position: "absolute",
      width: 400,
      height: 400,
      borderRadius: 200,
      backgroundColor: `${Colors.primary}05`,
      top: -100,
      right: -100,
    },
    splashOrb2: {
      position: "absolute",
      width: 300,
      height: 300,
      borderRadius: 150,
      backgroundColor: `${Colors.blue}03`,
      bottom: -50,
      left: -100,
    },
    centerContent: {
      alignItems: "center",
      width: "100%",
      paddingHorizontal: 40,
    },
    logoContainer: {
      marginBottom: Spacing.lg,
      alignItems: "center",
      justifyContent: "center",
    },
    textBlock: {
      alignItems: "center",
      marginBottom: 40,
      paddingVertical: 14,
      paddingHorizontal: 22,
      borderRadius: 16,
      backgroundColor: `${Colors.gold}10`,
      borderWidth: 1,
      borderColor: `${Colors.gold}30`,
    },
    dedicationDivider: {
      width: 32,
      height: 2,
      backgroundColor: Colors.gold,
      borderRadius: 2,
      opacity: 0.6,
      marginBottom: 8,
    },
    dedicationLabel: {
      fontFamily: "Tajawal_700Bold",
      fontSize: 12,
      fontWeight: "800",
      letterSpacing: 2,
      color: Colors.gold,
      marginBottom: 6,
    },
    dedicationText: {
      fontFamily: "Tajawal_400Regular",
      fontSize: 13,
      color: Colors.textPrimary,
      textAlign: "center",
      lineHeight: 20,
    },
    dedicationDua: {
      fontFamily: "Tajawal_400Regular",
      fontSize: 11,
      color: Colors.gold,
      marginTop: 6,
      opacity: 0.9,
    },
    loadingContainer: {
      alignItems: "center",
      marginTop: 20,
      height: 2,
      backgroundColor: "rgba(255,255,255,0.05)",
      borderRadius: 2,
      overflow: "hidden",
    },
    sleekLineFill: {
      height: "100%",
      backgroundColor: Colors.primary,
      borderRadius: 2,
    },
    bottomQuote: {
      position: "absolute",
      bottom: 60,
      alignItems: "center",
    },
    quoteText: {
      fontFamily: "Tajawal_700Bold",
      fontSize: 16,
      color: Colors.primary,
      fontWeight: "600",
      marginBottom: 8,
    },
    logoImageSplash: {
      width: 240,
      height: 240,
    },
  });
