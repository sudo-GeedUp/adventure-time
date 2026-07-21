export default {
  expo: {
    name: "Its Adventure Time",
    slug: "my-app",
    owner: "sinjingallegos",
    icon: "./assets/images/icon.png",
    reactCompiler: false,
    version: "2.0.0",

    runtimeVersion: {
      policy: "sdkVersion",
    },

    plugins: [
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Its Adventure Time uses your location for the live trail map, nearby trail and offroader discovery, route and distance tracking during adventures, turn-by-turn voice guidance, AR trail markers, live convoy sharing, and emergency SOS. For example, when you start an adventure your GPS coordinates are recorded along the route, and if you trigger SOS your current location is shared with emergency contacts.",
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
    ],

    ios: {
      bundleIdentifier: "com.masongallegos.itsadventuretime",
      buildNumber: "6",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    extra: {
      eas: {
        projectId: "02cac41b-21af-4ee7-bda0-26b4042a9013",
      },
    },
  },
};
