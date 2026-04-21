import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { NotificationSettings } from '../types';

// ─────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────

const NOTIF_HASH_KEY = 'husoon_notif_settings_hash';

// One fixed identifier per reminder type
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
// Scheduling-lock timestamp
//
// expo-notifications fires a daily repeating notification IMMEDIATELY
// if scheduled after the target time has already passed today.
// We set this timestamp right before scheduling and use it inside
// setNotificationHandler to silence any notification that arrives
// within SCHEDULING_GRACE_MS of a scheduling call.
// ─────────────────────────────────────────────────────────────────

const SCHEDULING_GRACE_MS = 8_000; // 8-second window after scheduling
let _schedulingLockUntil = 0;      // epoch ms — 0 means no active lock

// ─────────────────────────────────────────────────────────────────
// Lazy loader — avoids web/Expo Go side-effects at import time
// ─────────────────────────────────────────────────────────────────

let _Notifications: any = null;

function getNotifications(): any | null {
  if (Platform.OS === 'web') return null;
  if (_Notifications) return _Notifications;

  // Silence Expo Go's Android push-token warning (local-only app)
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

  // Global notification handler — registered once.
  // Suppress any notification that fires during the scheduling grace window
  // (these are the "catch-up" fires that expo-notifications emits immediately
  // when you schedule a daily trigger whose time has already passed today).
  _Notifications.setNotificationHandler({
    handleNotification: async () => {
      const now = Date.now();
      const isInLock = now < _schedulingLockUntil;

      if (isInLock) {
        // Silently suppressed
      }

      return {
        shouldShowBanner: !isInLock,
        shouldShowList:   !isInLock,
        shouldPlaySound:  !isInLock,
        shouldSetBadge: false,
      };
    },
  });

  return _Notifications;
}

// ─────────────────────────────────────────────────────────────────
// Simple string hash for change-detection
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

  // ── Cancel all managed notifications ──────────────────────────

  async cancelAllFortressReminders(): Promise<void> {
    const notifs = getNotifications();
    if (!notifs) return;
    await Promise.all(
      FORTRESS_IDS.map((id) =>
        notifs.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    );
    await AsyncStorage.removeItem(NOTIF_HASH_KEY).catch(() => {});
  },

  // ── Clear saved hash (force reschedule on next call) ──────────
  // Call this after a major state change (e.g., onboarding complete,
  // full data reset) so the next scheduleFortressReminders() always runs.

  async clearSavedHash(): Promise<void> {
    await AsyncStorage.removeItem(NOTIF_HASH_KEY).catch(() => {});
  },

  // ── Main scheduling entry-point ────────────────────────────────
  //
  // Strategy:
  //  1. Hash the current settings; compare with the persisted hash.
  //     If identical → nothing changed since last run → skip entirely.
  //  2. Acquire the scheduling lock to suppress the immediate catch-up
  //     notifications that expo fires when today's trigger time is past.
  //  3. Cancel all existing fortress notifications (clean slate).
  //  4. If master switch is off → persist hash + done.
  //  5. For each enabled fortress: schedule with { hour, minute, repeats: true }.
  //     The lock window ensures the instant catch-up fires are silenced.
  //  6. Release lock after SCHEDULING_GRACE_MS and persist the new hash.
  //
  async scheduleFortressReminders(settings: NotificationSettings): Promise<void> {
    if (Platform.OS === 'web') return;
    const notifs = getNotifications();
    if (!notifs) return;

    // Need permission before we can schedule anything
    const { status } = await notifs.getPermissionsAsync();
    if (status !== 'granted') {
      return;
    }

    // ── 1. De-duplicate via persistent hash ────────────────────
    const newHash = simpleHash(JSON.stringify(settings));
    try {
      const savedHash = await AsyncStorage.getItem(NOTIF_HASH_KEY);
      if (savedHash === newHash) {
        return;
      }
    } catch {
      // Ignore AsyncStorage errors; just proceed
    }

    // ── 2. Acquire scheduling lock BEFORE cancelling/re-scheduling ─
    // This ensures setNotificationHandler suppresses any immediate
    // catch-up fires that expo emits during/after scheduleNotificationAsync.
    _schedulingLockUntil = Date.now() + SCHEDULING_GRACE_MS;

    // ── 3. Cancel everything (clean slate) ─────────────────────
    await Promise.all(
      FORTRESS_IDS.map((id) =>
        notifs.cancelScheduledNotificationAsync(id).catch(() => {})
      )
    );

    // ── 4. Master switch off → persist hash + release lock ─────
    if (!settings.enabled) {
      await AsyncStorage.setItem(NOTIF_HASH_KEY, newHash).catch(() => {});
      // No ongoing notifications to catch-up, release lock early
      _schedulingLockUntil = 0;
      return;
    }

    // ── 5. Define each fortress ────────────────────────────────
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

    // ── 6. Schedule each enabled fortress ──────────────────────
    const results = await Promise.allSettled(
      fortresses.map(async (f) => {
        if (!f.enabled) return;

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
            // Daily repeating trigger — expo may fire a catch-up immediately
            // if this time has already passed today, but the scheduling lock
            // set above will suppress that spurious notification.
            hour: hours,
            minute: minutes,
            repeats: true,
            // @ts-ignore
            channelId: 'husoon_reminders',
          },
        });
      })
    );

    // Log any failures without crashing
    results.forEach((r, i) => {
      if (r.status === 'rejected') {
        console.warn(
          `[NotificationService] ✗ Failed: ${fortresses[i].identifier}:`,
          r.reason,
        );
      }
    });

    // ── 7. Persist hash; lock will auto-expire after SCHEDULING_GRACE_MS ─
    await AsyncStorage.setItem(NOTIF_HASH_KEY, newHash).catch(() => {});

    // Auto-release the lock after the grace window
    setTimeout(() => {
      if (Date.now() >= _schedulingLockUntil) {
        _schedulingLockUntil = 0;
      }
    }, SCHEDULING_GRACE_MS + 500);
  },
};
