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

    ios: {
      bundleIdentifier: "com.masongallegos.itsadventuretime",
      buildNumber: "3",
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
