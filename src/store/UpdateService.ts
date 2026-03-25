import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";

/**
 * Interface for the detailed update information.
 */
export interface UpdateInfo {
  hasUpdate: boolean;
  isMandatory: boolean;
  isAppDisabled: boolean;
  disabledMessage?: string;
  latestVersion: string;
  changelog?: string;
  link?: string;
  minRequiredVersion?: string;
}

const CACHE_KEY = "@alhouson_update_cache";

/**
 * Service to check for new app versions and app status.
 */
export const UpdateService = {
  CURRENT_VERSION: Constants.expoConfig?.version || "1.0.0",

  CHECK_URL:
    "https://raw.githubusercontent.com/mustafa-ahmad-work/alhousonalkhamsa/main/version.json?cachebuster=" +
    Date.now(),

  /**
   * Main check function that handles remote fetching and local caching.
   */
  async checkForUpdate(): Promise<UpdateInfo | null> {
    try {
      // 1. Try to fetch from remote
      const response = await fetch(this.CHECK_URL, {
        headers: { "Cache-Control": "no-cache" },
      });

      if (response.ok) {
        const data = await response.json();
        const info = this.processUpdateData(data);
        
        // Save to cache
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(info));
        return info;
      }
    } catch (error) {
      console.warn("Failed to catch remote update, falling back to cache:", error);
    }

    // 2. Fallback to cache if offline or fetch failed
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached);
    } catch (e) {
      // ignore
    }

    return null;
  },

  /**
   * Processes the raw JSON from the server and determines the status.
   */
  processUpdateData(data: any): UpdateInfo {
    const latestVersion = data.latestVersion || "1.0.0";
    const minRequiredVersion = data.minRequiredVersion || "1.0.0";
    const isAppDisabled = !!data.isAppDisabled;

    const hasUpdate = this.isVersionGreater(latestVersion, this.CURRENT_VERSION);
    const isMandatory = this.isVersionGreater(minRequiredVersion, this.CURRENT_VERSION);

    return {
      hasUpdate,
      isMandatory,
      isAppDisabled,
      disabledMessage: data.disabledMessage || "التطبيق يخضع للصيانة، نعتذر عن الإزعاج.",
      latestVersion,
      changelog: data.changelog,
      link: data.link || "https://github.com/mustafa-ahmad-work/alhousonalkhamsa/releases",
      minRequiredVersion,
    };
  },

  /**
   * Compares two semantic version strings.
   * Returns true if v1 > v2.
   */
  isVersionGreater(v1: string, v2: string): boolean {
    const v1Parts = v1.split(".").map((p) => parseInt(p, 10));
    const v2Parts = v2.split(".").map((p) => parseInt(p, 10));

    for (let i = 0; i < Math.max(v1Parts.length, v2Parts.length); i++) {
      const p1 = v1Parts[i] || 0;
      const p2 = v2Parts[i] || 0;
      if (p1 > p2) return true;
      if (p1 < p2) return false;
    }
    return false;
  },
};
