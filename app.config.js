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
            "Its Adventure Time uses your location to show your position on the live trail map and nearby trails while you ride. For example, during an active adventure we record your route, speed, and distance so you can review your trip, and you can share your current location with emergency contacts if needed.",
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
      buildNumber: "5",
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
