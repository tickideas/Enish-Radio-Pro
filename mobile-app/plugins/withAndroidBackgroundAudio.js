const { withAndroidManifest, AndroidConfig } = require("expo/config-plugins");

/**
 * Config plugin to enable background audio playback on Android
 * This adds the necessary foreground service configuration for media playback
 */
const withAndroidBackgroundAudio = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;

    // Add tools namespace if not present
    if (!manifest.manifest.$["xmlns:tools"]) {
      manifest.manifest.$["xmlns:tools"] = "http://schemas.android.com/tools";
    }

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);

    // Initialize service array if not present
    mainApplication["service"] = mainApplication["service"] || [];

    // Check if media playback service already exists
    const existingService = mainApplication["service"].find(
      (service) => service.$["android:name"] === "expo.modules.av.player.AudioForegroundService"
    );

    if (!existingService) {
      // Add foreground service for media playback
      mainApplication["service"].push({
        $: {
          "android:name": "expo.modules.av.player.AudioForegroundService",
          "android:foregroundServiceType": "mediaPlayback",
          "android:exported": "false",
          "tools:replace": "android:foregroundServiceType",
        },
      });
    }

    // Also ensure the uses-permission for foreground service is properly declared
    manifest.manifest["uses-permission"] = manifest.manifest["uses-permission"] || [];
    
    const permissions = [
      "android.permission.FOREGROUND_SERVICE",
      "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
      "android.permission.WAKE_LOCK",
    ];

    permissions.forEach((permission) => {
      const exists = manifest.manifest["uses-permission"].some(
        (p) => p.$["android:name"] === permission
      );
      if (!exists) {
        manifest.manifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    return config;
  });
};

module.exports = withAndroidBackgroundAudio;
