import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NotificationSettings } from '../types';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const NOTIF_HASH_KEY = 'husoon_notif_settings_hash';

// The fixed identifiers we manage — one per fortress
const FORTRESS_IDS = [
  'fortress_recitation',
  'fortress_listening',
  'fortress_weekly_prep',
  'fortress_nightly_prep',
  'fortress_daily_prep',
  'fortress_memorization',
  'fortress_review',
] as const;

// ─────────────────────────────────────────────────────────────────
// Lazy loader — avoids web/Expo Go side-effects
// ─────────────────────────────────────────────────────────────────

let _Notifications: any = null;

function getNotifications(): any | null {
  if (Platform.OS === 'web') return null;
  if (_Notifications) return _Notifications;

  // Silence Expo Go's Android push-token warning (we only use local notifications)
  const isGo = Constants.appOwnership === 'expo';
  if (isGo && !(console as any).__notifFilterInstalled) {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      if (args.join(' ').includes('Android Push notifications')) return;
      originalError.apply(console, args);
    };
    (console as any).__notifFilterInstalled = true;
  }

  try {
    _Notifications = require('expo-notifications');
  } catch {
    console.warn('[NotificationService] expo-notifications not available');
    return null;
  }

  // Set a global handler once — only show notifications that are NOT from the
  // current session's startup burst (they fire within the first 3 s).
  const launchTime = Date.now();
  _Notifications.setNotificationHandler({
    handleNotification: async () => {
      const age = Date.now() - launchTime;
      const show = age > 3_000; // suppress instant catch-up on app open
      return {
        shouldShowBanner: show,
        shouldShowList: show,
        shouldPlaySound: show,
        shouldSetBadge: false,
      };
    },
  });

  return _Notifications;
}

// ─────────────────────────────────────────────────────────────────
// Simple hash — fast string → number
// ─────────────────────────────────────────────────────────────────

function simpleHash(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h.toString(16);
}

// ─────────────────────────────────────────────────────────────────
// Export
// ─────────────────────────────────────────────────────────────────

export const NotificationService = {
  // ── Permissions ────────────────────────────────────────────────

  async registerForPushNotificationsAsync(): Promise<void> {
    if (Platform.OS === 'web') return;
    const notifs = getNotifications();
    if (!notifs) return;

    try {
      const { status: existing } = await notifs.getPermissionsAsync();
      let final = existing;
      if (existing !== 'granted') {
        const { status } = await notifs.requestPermissionsAsync();
        final = status;
      }
      if (final !== 'granted') return;

      if (Platform.OS === 'android') {
        await notifs.setNotificationChannelAsync('husoon_reminders', {
          name: 'تنبيهات الحفظ',
          importance: notifs.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#10B981',
          sound: 'default',
        });
      }
    } catch (e) {
      console.warn('[NotificationService] Permission error:', e);
    }
  },

  async getPermissionStatus(): Promise<string> {
    if (Platform.OS === 'web') return 'granted';
    const notifs = getNotifications();
    if (!notifs) return 'denied';
    const { status } = await notifs.getPermissionsAsync();
    return status;
  },

  async requestPermissions(): Promise<string> {
    if (Platform.OS === 'web') return 'granted';
    const notifs = getNotifications();
    if (!notifs) return 'denied';
    const { status } = await notifs.requestPermissionsAsync();
    return status;
  },

  async openNotificationSettings(): Promise<void> {
    if (Platform.OS === 'web') return;
    if (Platform.OS === 'ios') Linking.openURL('app-settings:');
    else Linking.openSettings();
  },

  // ── Cancel all managed notifications ───────────────────────────

  async cancelAllFortressReminders(): Promise<void> {
    const notifs = getNotifications();
    if (!notifs) return;
    await Promise.all(
      FORTRESS_IDS.map((id) =>
        notifs.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    );
    await AsyncStorage.removeItem(NOTIF_HASH_KEY).catch(() => {});
    console.log('[NotificationService] All fortress reminders cancelled');
  },

  // ── Main scheduling entry-point ────────────────────────────────
  //
  // Strategy:
  //  1. Hash the settings. Compare with last-saved hash from AsyncStorage.
  //  2. If same → nothing changed, skip.
  //  3. Cancel ALL existing fortress notifications (ensures clean slate).
  //  4. Re-schedule only enabled ones.
  //  5. Persist new hash so the next app launch can skip redundant work.
  //
  async scheduleFortressReminders(settings: NotificationSettings): Promise<void> {
    if (Platform.OS === 'web') return;
    const notifs = getNotifications();
    if (!notifs) return;

    // Check permissions first — don't bother scheduling without them
    const { status } = await notifs.getPermissionsAsync();
    if (status !== 'granted') {
      console.log('[NotificationService] No permission — skipping schedule');
      return;
    }

    // ── 1. De-duplicate with persistent hash ───────────────────
    const newHash = simpleHash(JSON.stringify(settings));
    try {
      const savedHash = await AsyncStorage.getItem(NOTIF_HASH_KEY);
      if (savedHash === newHash) {
        console.log('[NotificationService] Settings unchanged — skipping');
        return;
      }
    } catch {
      // AsyncStorage unavailable — proceed anyway
    }

    console.log('[NotificationService] Settings changed — rescheduling all');

    // ── 2. Cancel everything (clean slate) ─────────────────────
    await Promise.all(
      FORTRESS_IDS.map((id) =>
        notifs.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    );

    // ── 3. If master switch is off, stop here ──────────────────
    if (!settings.enabled) {
      await AsyncStorage.setItem(NOTIF_HASH_KEY, newHash).catch(() => {});
      console.log('[NotificationService] Master switch OFF — all cancelled');
      return;
    }

    // ── 4. Define fortress data ────────────────────────────────
    const fortresses = [
      {
        identifier: 'fortress_recitation' as const,
        title: 'ورد التلاوة (جزئين يومياً)',
        body: 'حان وقت ورد التلاوة.. جزئين يومياً بنظام الحَدر يحقق التثبيت البصري لمصحفك.',
        enabled: settings.recitationEnabled,
        time: settings.recitationTime,
      },
      {
        identifier: 'fortress_listening' as const,
        title: 'ورد الاستماع (حزب واحد)',
        body: 'أنصت للقرآن لضبط المخارج.. حزب واحد يومياً بصوت متقن يعزز جودة حفظك.',
        enabled: settings.listeningEnabled,
        time: settings.listeningTime,
      },
      {
        identifier: 'fortress_weekly_prep' as const,
        title: 'التحضير الأسبوعي',
        body: 'استعد للأسبوع القادم.. قراءة صفحات الأسبوع القادم يومياً تيسر عليك حفظها لاحقاً.',
        enabled: settings.weeklyPrepEnabled,
        time: settings.weeklyPrepTime,
      },
      {
        identifier: 'fortress_nightly_prep' as const,
        title: 'التحضير الليلي (قبل النوم)',
        body: 'آخر عهدك اليوم.. ٣٠ دقيقة قراءةً واستماعاً لصفحة الغد تمنحك صورة مستقرة للحفظ.',
        enabled: settings.nightlyPrepEnabled,
        time: settings.nightlyPrepTime,
      },
      {
        identifier: 'fortress_daily_prep' as const,
        title: 'التحضير القبلي (قبل الحفظ)',
        body: 'التهيؤ الذهني.. ١٥ دقيقة من تركيزك الآن هي جسرك للحفظ المتمكن والمستديم.',
        enabled: settings.dailyPrepEnabled,
        time: settings.dailyPrepTime,
      },
      {
        identifier: 'fortress_memorization' as const,
        title: 'الحفظ الجديد (١٥ دقيقة)',
        body: 'موعد الحفظ الجديد.. كرر الصفحة ١٥ دقيقة على الأقل لنقلها إلى الذاكرة البعيدة.',
        enabled: settings.memorizationEnabled,
        time: settings.memorizationTime,
      },
      {
        identifier: 'fortress_review' as const,
        title: 'المراجعة (القريبة والبعيدة)',
        body: 'ثبّت ما حفظت.. المراجعة اليومية هي المرحلة المنيعة ضد التفلت والنسيان.',
        enabled: settings.reviewEnabled,
        time: settings.reviewTime,
      },
    ];

    // ── 5. Schedule each enabled fortress ─────────────────────
    const results = await Promise.allSettled(
      fortresses.map(async (f) => {
        if (!f.enabled) return; // disabled — already cancelled above

        const [hours, minutes] = f.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) {
          console.warn(`[NotificationService] Bad time for ${f.identifier}: "${f.time}"`);
          return;
        }

        await notifs.scheduleNotificationAsync({
          identifier: f.identifier,
          content: {
            title: f.title,
            body: f.body,
            data: { fortressId: f.identifier },
            sound: 'default',
            // @ts-ignore — Android channel
            channelId: 'husoon_reminders',
          },
          trigger: {
            hour: hours,
            minute: minutes,
            repeats: true,
            // @ts-ignore
            channelId: 'husoon_reminders',
          },
        });

        console.log(`[NotificationService] ✓ Scheduled ${f.identifier} @ ${f.time}`);
      })
    );

    // Log failures without crashing
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(`[NotificationService] ✗ Failed to schedule ${fortresses[i].identifier}:`, r.reason);
      }
    });

    // ── 6. Persist hash so next launch skips if unchanged ─────
    await AsyncStorage.setItem(NOTIF_HASH_KEY, newHash).catch(() => {});
    console.log('[NotificationService] Rescheduling complete');
  },
};
