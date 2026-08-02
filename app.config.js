export default {
  expo: {
    name: "Its Adventure Time",
    slug: "my-app",
    owner: "sinjingallegos",
    icon: "./assets/images/icon.png",
    reactCompiler: false,
    version: "2.1.1",

    runtimeVersion: {
      policy: "sdkVersion",
    },

    updates: {
      enabled: true,
      url: "https://u.expo.dev/02cac41b-21af-4ee7-bda0-26b4042a9013",
      checkAutomatically: "ON_LOAD",
      fallbackToCacheTimeout: 0,
    },

    plugins: [
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Its Adventure Time uses your location for the live trail map, nearby trail and offroader discovery, route and distance tracking during adventures, spoken trail callouts, and emergency SOS. For example, when you start an adventure your GPS coordinates are recorded along the route, and if you trigger SOS your current location is shared with emergency contacts.",
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
          isAndroidForegroundServiceEnabled: false,
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Its Adventure Time needs camera access for AI Recovery Scan to analyze recovery situations and provide equipment recommendations.",
          microphonePermission: false,
          recordAudioAndroid: false,
        },
      ],
      [
        "expo-notifications",
        {
          mode:
            process.env.EXPO_PUBLIC_NOTIFICATIONS_MODE ||
            (process.env.EAS_BUILD_PROFILE === "development"
              ? "development"
              : "production"),
          color: "#FF6B35",
          defaultChannel: "default",
        },
      ],
    ],

    ios: {
      bundleIdentifier: "com.masongallegos.itsadventuretime",
      buildNumber: "10",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: "com.masongallegos.itsadventuretime",
      versionCode: 11,
      adaptiveIcon: {
        foregroundImage: "./assets/images/icon.png",
        backgroundColor: "#FF6B35",
      },
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },

    extra: {
      eas: {
        projectId: "02cac41b-21af-4ee7-bda0-26b4042a9013",
      },
      mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN,
      mapTilerKey: process.env.EXPO_PUBLIC_MAPTILER_KEY,
    },
  },
};
