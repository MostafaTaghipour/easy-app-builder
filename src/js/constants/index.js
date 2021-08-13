const iosDistribiutionMethods = {
  adHoc: {
    title: 'Ad Hoc',
    description: 'Install on designated devices.',
  },
  appStore: {
    title: 'App Store Connect',
    description: 'Distribute on TestFlight and App Store.',
  },
};

module.exports = {
  USER_ROOT_DIR_KEY: '{{userRootDir}}',
  PROJECT_ROOT_DIR_KEY: '{{projRootDir}}',
  PROJECT_NAME_KEY: '{{projName}}',
  OUTPUT_PATH_KEY: '{{outputPath}}',
  OUTPUT_NAME_KEY: '{{outputName}}',
  VERSION_NAME_KEY: '{{versionName}}',
  BUILD_NAMBER_KEY: '{{buildNumber}}',
  APP_NAME_KEY: '{{appName}}',
  APP_VARIANT: '{{appVariant}}',
  APP_EXTENSION: '{{appExtension}}',
  APP_PLATFORM: '{{appPlatform}',
  IOS_DISTRIBUTION_METHODS: iosDistribiutionMethods,
};
