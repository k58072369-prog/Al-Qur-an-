import Constants from "expo-constants";

/**
 * Service to check for new app versions.
 * Fetches from a remote JSON file on GitHub.
 */
export const UpdateService = {
  CURRENT_VERSION: Constants.expoConfig?.version || "1.0.0",

  // The actual URL provided by the user
  CHECK_URL:
    "https://raw.githubusercontent.com/mustafa-ahmad-work/alhousonalkhamsa/main/version.json",

  async checkForUpdate(): Promise<{
    hasUpdate: boolean;
    latestVersion?: string;
    changelog?: string;
    link?: string;
  } | null> {
    try {
      const response = await fetch(this.CHECK_URL, {
        headers: {
          "Cache-Control": "no-cache",
        },
      });

      if (!response.ok) return null;

      const data = await response.json();

      if (!data || !data.latestVersion) return { hasUpdate: false };

      const hasUpdate = this.isVersionGreater(
        data.latestVersion,
        this.CURRENT_VERSION,
      );

      return {
        hasUpdate,
        latestVersion: data.latestVersion,
        changelog: data.changelog,
        link: data.link,
      };
    } catch (error) {
      console.warn("Failed to check for updates:", error);
      return null;
    }
  },

  /**
   * Compares two semantic version strings.
   * Returns true if latest > current.
   */
  isVersionGreater(latest: string, current: string): boolean {
    const latestParts = latest.split(".").map((p) => parseInt(p, 10));
    const currentParts = current.split(".").map((p) => parseInt(p, 10));

    for (let i = 0; i < latestParts.length; i++) {
      const l = latestParts[i] || 0;
      const c = currentParts[i] || 0;
      if (l > c) return true;
      if (l < c) return false;
    }
    return false;
  },
};
