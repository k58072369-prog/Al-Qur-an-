import { Platform, Linking } from 'react-native';
import Constants from 'expo-constants';
import { NotificationSettings } from '../types';

// Lazy loader for expo-notifications to avoid side-effects in Expo Go (SDK 53+)
const getNotifications = () => {
  if (Platform.OS === 'web') return null;
  
  // Hack for Expo Go: Silence the library's internal warning about push tokens
  // because we only care about Local Notifications.
  const isGo = Constants.appOwnership === 'expo';
  
  if (isGo && !((console as any).__notifFilterInstalled)) {
    const originalError = console.error;
    console.error = (...args: any[]) => {
      const msg = args.join(' ');
      if (msg.includes('Android Push notifications')) {
        return; // Silence this specific library-side effect
      }
      originalError.apply(console, args);
    };
    (console as any).__notifFilterInstalled = true;
  }

  try {
    return require('expo-notifications');
  } catch (e) {
    console.warn('expo-notifications not available');
    return null;
  }
};

// Internal reference
let _Notifications: any = null;
const Notifications = () => {
  if (!_Notifications) {
    _Notifications = getNotifications();
    if (_Notifications && _Notifications.setNotificationHandler) {
      const launchTime = Date.now();
      _Notifications.setNotificationHandler({
        handleNotification: async () => {
          // Suppress notifications firing immediately on launch (common in Expo Go 'missed' catch-up)
          const timeSinceLaunch = Date.now() - launchTime;
          const shouldShow = timeSinceLaunch > 5000;
          
          return {
            shouldShowBanner: shouldShow,
            shouldShowList: shouldShow,
            shouldPlaySound: shouldShow,
            shouldSetBadge: false,
          };
        },
      });
    }
  }
  return _Notifications;
};

const isExpoGo = Constants.appOwnership === 'expo';

export const NotificationService = {
  async registerForPushNotificationsAsync() {
    if (Platform.OS === 'web') return;
    const notifs = Notifications();
    if (!notifs) return;

    if (isExpoGo) {
      console.log('[NotificationService] Running in Expo Go. Local notifications should work, but push features are limited.');
    }

    try {
      const { status: existingStatus } = await notifs.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await notifs.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') return;

      if (Platform.OS === 'android') {
        await notifs.setNotificationChannelAsync('default', {
          name: 'default',
          importance: notifs.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  },

  async getPermissionStatus() {
    if (Platform.OS === 'web') return 'granted';
    const notifs = Notifications();
    if (!notifs) return 'denied';
    const { status } = await notifs.getPermissionsAsync();
    return status;
  },

  async requestPermissions() {
    if (Platform.OS === 'web') return 'granted';
    const notifs = Notifications();
    if (!notifs) return 'denied';
    const { status } = await notifs.requestPermissionsAsync();
    return status;
  },

  async openNotificationSettings() {
    if (Platform.OS === 'web') return;
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  },

  // Cache to avoid redundant calls within the same run
  _lastSettingsJson: '',

  async scheduleFortressReminders(settings: NotificationSettings) {
    if (Platform.OS === 'web') return;
    const notifs = Notifications();
    if (!notifs) return;

    // Avoid redundant calls in-memory
    const settingsJson = JSON.stringify(settings);
    if (this._lastSettingsJson === settingsJson) return;
    this._lastSettingsJson = settingsJson;

    try {
      // 1. Get currently scheduled notifications
      const existing = await notifs.getAllScheduledNotificationsAsync();
      
      const fortressesData = [
        { 
          id: 'recitation', 
          label: 'ورد التلاوة (جزئين يومياً)', 
          enabled: settings.recitationEnabled, 
          time: settings.recitationTime, 
          body: 'حان وقت ورد التلاوة.. جزئين يومياً بنظام "الحدر" ليتحقق التثبيت البصري لمصحفك.' 
        },
        { 
          id: 'listening', 
          label: 'ورد الاستماع (حزب واحد)', 
          enabled: settings.listeningEnabled, 
          time: settings.listeningTime, 
          body: 'أنصت للقرآن لضبط المخارج.. حزب واحد يومياً بصوت متقن يعزز جودة حفظك.' 
        },
        { 
          id: 'weekly_prep', 
          label: 'التحضير الأسبوعي', 
          enabled: settings.weeklyPrepEnabled, 
          time: settings.weeklyPrepTime, 
          body: 'استعد للأسبوع القادم.. قراءة صفحات الأسبوع القادم يومياً تيسر عليك حفظها لاحقاً.' 
        },
        { 
          id: 'nightly_prep', 
          label: 'التحضير الليلي (قبل النوم)', 
          enabled: settings.nightlyPrepEnabled, 
          time: settings.nightlyPrepTime, 
          body: 'آخر عهدك اليوم.. 30 دقيقة من القراءة والاستماع لصفحة الغد تجعل في ذهنك صورة واضحة ومستقرة للحفظ.' 
        },
        { 
          id: 'daily_prep', 
          label: 'التحضير القبلي (قبل الحفظ)', 
          enabled: settings.dailyPrepEnabled, 
          time: settings.dailyPrepTime, 
          body: 'التهيؤ الذهني.. 15 دقيقة من تركيزك الآن قبل البدء هي جسرك للحفظ المتمكن والمستديم.' 
        },
        { 
          id: 'memorization', 
          label: 'الحفظ الجديد (15 دقيقة)', 
          enabled: settings.memorizationEnabled, 
          time: settings.memorizationTime, 
          body: 'موعد الحفظ الجديد.. كرر الصفحة لمدة 15 دقيقة على الأقل لنقلها للذاكرة البعيدة.' 
        },
        { 
          id: 'review', 
          label: 'المراجعة (القريبة والبعيدة)', 
          enabled: settings.reviewEnabled, 
          time: settings.reviewTime, 
          body: 'ثبّت ما حفظت.. المراجعة اليومية هي الحصن المنيع ضد التفلت والنسيان.' 
        },
      ];

      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();

      for (const fortress of fortressesData) {
        const identifier = `fortress_${fortress.id}`;
        
        // If disabled, cancel this specific one and skip
        if (!fortress.enabled || !settings.enabled) {
          await notifs.cancelScheduledNotificationAsync(identifier);
          continue;
        }

        const [hours, minutes] = fortress.time.split(':').map(Number);
        if (isNaN(hours) || isNaN(minutes)) continue;

        // Check if ALREADY scheduled with same time
        const existingNotif = existing.find((n: any) => n.identifier === identifier);
        if (existingNotif) {
          const trigger = existingNotif.trigger as any;
          if (trigger.hour === hours && trigger.minute === minutes) {
            // Already scheduled for the same time, skip
            continue;
          }
        }

        // Safety: If scheduled for EXACTLY this minute, skip to avoid immediate fire
        if (hours === currentHour && minutes === currentMin) {
          continue;
        }

        console.log(`[NotificationService] Scheduling ${identifier} for ${fortress.time}`);
        
        try {
          await notifs.scheduleNotificationAsync({
            identifier, // Fixed ID prevents duplicates
            content: {
              title: fortress.label,
              body: fortress.body,
              data: { fortressId: fortress.id },
              sound: true,
              // @ts-ignore
              channelId: 'default',
            },
            trigger: {
              hour: hours,
              minute: minutes,
              repeats: true,
              // @ts-ignore
              channelId: 'default',
            } as any,
          });
        } catch (e) {
          console.warn(`[NotificationService] Error scheduling ${identifier}:`, e);
        }
      }
    } catch (err) {
      console.warn('[NotificationService] Error scheduling:', err);
    }
  },
};
