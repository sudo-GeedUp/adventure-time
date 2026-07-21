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
            "Its Adventure Time uses your location to show your position on the live trail map, find nearby trails and measure distance to trailheads, record route, speed, and distance during an active adventure, load nearby offroaders, trail conditions, and weather, anchor AR trail markers, and share your current location and route with emergency contacts.",
          locationAlwaysAndWhenInUsePermission: false,
          locationAlwaysPermission: false,
          isIosBackgroundLocationEnabled: false,
          isAndroidBackgroundLocationEnabled: false,
          isAndroidForegroundServiceEnabled: false,
        },
      ],
    ],

    ios: {
      bundleIdentifier: "com.masongallegos.itsadventuretime",
      buildNumber: "4",
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
