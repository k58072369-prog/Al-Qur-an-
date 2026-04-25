/**
 * NotificationService.test.ts
 * Tests the notification scheduling logic — specifically the hash-based
 * deduplication and the time-parsing logic.
 * expo-notifications and AsyncStorage are fully mocked.
 */

// ─── Mocks ────────────────────────────────────────────────────────────────────
const mockScheduleNotification = jest.fn().mockResolvedValue(undefined);
const mockCancelNotification = jest.fn().mockResolvedValue(undefined);
const mockGetPermissions = jest.fn().mockResolvedValue({ status: 'granted' });
const mockSetItem = jest.fn().mockResolvedValue(undefined);
const mockGetItem = jest.fn().mockResolvedValue(null);
const mockRemoveItem = jest.fn().mockResolvedValue(undefined);

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (...args: any[]) => mockSetItem(...args),
  getItem: (...args: any[]) => mockGetItem(...args),
  removeItem: (...args: any[]) => mockRemoveItem(...args),
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: () => mockGetPermissions(),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  scheduleNotificationAsync: (...args: any[]) => mockScheduleNotification(...args),
  cancelScheduledNotificationAsync: (...args: any[]) => mockCancelNotification(...args),
  setNotificationChannelAsync: jest.fn().mockResolvedValue(undefined),
  AndroidImportance: { HIGH: 5 },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { version: '1.0.0' },
  appOwnership: 'standalone',
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
  Linking: { openURL: jest.fn(), openSettings: jest.fn() },
}));

import { NotificationService } from '../store/NotificationService';
import { NotificationSettings } from '../types';

// ─── Full default notification settings ──────────────────────────────────────
const defaultSettings: NotificationSettings = {
  enabled: true,
  recitationEnabled: true,
  recitationTime: '08:00',
  listeningEnabled: true,
  listeningTime: '10:00',
  weeklyPrepEnabled: true,
  weeklyPrepTime: '18:00',
  nightlyPrepEnabled: true,
  nightlyPrepTime: '22:00',
  dailyPrepEnabled: true,
  dailyPrepTime: '05:45',
  memorizationEnabled: true,
  memorizationTime: '06:00',
  reviewEnabled: true,
  reviewTime: '16:00',
};

beforeEach(() => {
  jest.clearAllMocks();
  mockGetItem.mockResolvedValue(null); // No saved hash by default
  mockGetPermissions.mockResolvedValue({ status: 'granted' });
});

// ─── SECTION 1: simpleHash deduplication ──────────────────────────────────────
// We test this indirectly: call scheduleFortressReminders twice with the same
// settings. The second call should NOT invoke scheduleNotificationAsync.
describe('scheduleFortressReminders — hash deduplication', () => {
  it('schedules notifications on first call (no saved hash)', async () => {
    mockGetItem.mockResolvedValue(null);
    await NotificationService.scheduleFortressReminders(defaultSettings);
    expect(mockScheduleNotification).toHaveBeenCalled();
  });

  it('skips scheduling on second call with same settings (hash match)', async () => {
    // First call — computes and saves hash
    mockGetItem.mockResolvedValue(null);
    await NotificationService.scheduleFortressReminders(defaultSettings);

    // Capture the hash that was saved
    const savedHash = mockSetItem.mock.calls.find(
      (c: any[]) => c[0] === 'husoon_notif_settings_hash'
    )?.[1];
    expect(savedHash).toBeDefined();

    // Second call — same settings, hash already stored
    jest.clearAllMocks();
    mockGetItem.mockResolvedValue(savedHash);
    await NotificationService.scheduleFortressReminders(defaultSettings);

    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('reschedules when settings change (hash mismatch)', async () => {
    // Set a fake old hash
    mockGetItem.mockResolvedValue('old_stale_hash_12345');
    await NotificationService.scheduleFortressReminders(defaultSettings);
    expect(mockScheduleNotification).toHaveBeenCalled();
  });
});

// ─── SECTION 2: Master switch OFF ────────────────────────────────────────────
describe('scheduleFortressReminders — master switch', () => {
  it('does NOT schedule any notifications when enabled=false', async () => {
    const disabledSettings: NotificationSettings = { ...defaultSettings, enabled: false };
    await NotificationService.scheduleFortressReminders(disabledSettings);
    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });

  it('still cancels existing notifications when disabled', async () => {
    const disabledSettings: NotificationSettings = { ...defaultSettings, enabled: false };
    await NotificationService.scheduleFortressReminders(disabledSettings);
    // cancelScheduledNotificationAsync should have been called for each fortress ID
    expect(mockCancelNotification).toHaveBeenCalledTimes(7); // 7 fortress IDs
  });
});

// ─── SECTION 3: Individual fortress enable/disable ────────────────────────────
describe('scheduleFortressReminders — per-fortress toggling', () => {
  it('only schedules enabled fortresses', async () => {
    const partialSettings: NotificationSettings = {
      ...defaultSettings,
      recitationEnabled: true,
      listeningEnabled: false,
      weeklyPrepEnabled: false,
      nightlyPrepEnabled: false,
      dailyPrepEnabled: false,
      memorizationEnabled: false,
      reviewEnabled: false,
    };
    await NotificationService.scheduleFortressReminders(partialSettings);
    // Only 1 fortress enabled → only 1 scheduleNotificationAsync call
    expect(mockScheduleNotification).toHaveBeenCalledTimes(1);
  });

  it('schedules all 7 when all fortresses are enabled', async () => {
    await NotificationService.scheduleFortressReminders(defaultSettings);
    expect(mockScheduleNotification).toHaveBeenCalledTimes(7);
  });
});

// ─── SECTION 4: Time parsing ──────────────────────────────────────────────────
describe('scheduleFortressReminders — time parsing', () => {
  it('correctly parses "08:00" as hour=8, minute=0', async () => {
    const settings: NotificationSettings = {
      ...defaultSettings,
      // Disable all except recitation to isolate the call
      listeningEnabled: false,
      weeklyPrepEnabled: false,
      nightlyPrepEnabled: false,
      dailyPrepEnabled: false,
      memorizationEnabled: false,
      reviewEnabled: false,
      recitationTime: '08:30',
    };
    await NotificationService.scheduleFortressReminders(settings);

    const call = mockScheduleNotification.mock.calls[0][0];
    expect(call.trigger.hour).toBe(8);
    expect(call.trigger.minute).toBe(30);
    expect(call.trigger.repeats).toBe(true);
  });

  it('uses correct identifier for each fortress', async () => {
    await NotificationService.scheduleFortressReminders(defaultSettings);

    const identifiers = mockScheduleNotification.mock.calls.map(
      (c: any[]) => c[0].identifier
    );
    expect(identifiers).toContain('fortress_recitation');
    expect(identifiers).toContain('fortress_listening');
    expect(identifiers).toContain('fortress_memorization');
    expect(identifiers).toContain('fortress_review');
  });
});

// ─── SECTION 5: cancelAllFortressReminders ───────────────────────────────────
describe('cancelAllFortressReminders', () => {
  it('cancels all 7 fortress notification IDs', async () => {
    await NotificationService.cancelAllFortressReminders();
    expect(mockCancelNotification).toHaveBeenCalledTimes(7);
  });

  it('removes the stored hash so next schedule always runs fresh', async () => {
    await NotificationService.cancelAllFortressReminders();
    expect(mockRemoveItem).toHaveBeenCalledWith('husoon_notif_settings_hash');
  });
});

// ─── SECTION 6: clearSavedHash ───────────────────────────────────────────────
describe('clearSavedHash', () => {
  it('removes the notification hash from AsyncStorage', async () => {
    await NotificationService.clearSavedHash();
    expect(mockRemoveItem).toHaveBeenCalledWith('husoon_notif_settings_hash');
  });
});

// ─── SECTION 7: No permission → no scheduling ────────────────────────────────
describe('scheduleFortressReminders — no permission', () => {
  it('does not schedule when permission is not granted', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'denied' });
    await NotificationService.scheduleFortressReminders(defaultSettings);
    expect(mockScheduleNotification).not.toHaveBeenCalled();
  });
});
