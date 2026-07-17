export default {
  expo: {
    reactCompiler: false,
    version: "1.0.4",

    runtimeVersion: {
      policy: "sdkVersion"
    },

    ios: {
      bundleIdentifier: "com.masongallegos.itsadventuretime",
      buildNumber: "4",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false
      }
    },

    extra: {
      eas: {
        projectId: "02cac41b-21af-4ee7-bda0-26b4042a9013"
      }
    }
  }
};

