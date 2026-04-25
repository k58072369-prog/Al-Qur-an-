import { UpdateService } from '../store/UpdateService';

// Mock expo-constants
jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0',
  },
}));

// Mock @react-native-async-storage/async-storage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('UpdateService', () => {
  describe('isVersionGreater', () => {
    it('should return true if v1 > v2', () => {
      expect(UpdateService.isVersionGreater('1.1.0', '1.0.9')).toBe(true);
      expect(UpdateService.isVersionGreater('2.0.0', '1.9.9')).toBe(true);
      expect(UpdateService.isVersionGreater('1.0.1', '1.0.0')).toBe(true);
    });

    it('should return false if v1 <= v2', () => {
      expect(UpdateService.isVersionGreater('1.0.0', '1.0.0')).toBe(false);
      expect(UpdateService.isVersionGreater('1.0.0', '1.0.1')).toBe(false);
      expect(UpdateService.isVersionGreater('0.9.9', '1.0.0')).toBe(false);
    });

    it('should handle different lengths', () => {
      expect(UpdateService.isVersionGreater('1.1', '1.0.9')).toBe(true);
      expect(UpdateService.isVersionGreater('1.0.1', '1.0')).toBe(true);
    });
  });

  describe('processUpdateData', () => {
    it('should correctly identify updates', () => {
      const data = {
        latestVersion: '1.1.0',
        minRequiredVersion: '1.0.0',
        isAppDisabled: false,
      };
      const result = UpdateService.processUpdateData(data);
      expect(result.hasUpdate).toBe(true);
      expect(result.isMandatory).toBe(false);
    });

    it('should correctly identify mandatory updates', () => {
      const data = {
        latestVersion: '1.2.0',
        minRequiredVersion: '1.1.0',
        isAppDisabled: false,
      };
      // Current version is 1.0.0 (mocked)
      const result = UpdateService.processUpdateData(data);
      expect(result.hasUpdate).toBe(true);
      expect(result.isMandatory).toBe(true);
    });
  });
});
