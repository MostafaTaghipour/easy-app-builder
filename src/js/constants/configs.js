const fs = require('fs');
const helpers = require('../helpers');

const defaultSettings = {
  android: {
    enable: true,
    clean: true,
    preScripts: [],
    postScripts: [],
    variants: {
      Default: {
        enable: true,
        buildScripts: helpers.getAndroidDefaultBuildScripts(),
      },
    },
  },
  ios: {
    enable: true,
    clean: true,
    pod: true,
    preScripts: [],
    postScripts: [],
    variants: {
      Default: {
        enable: true,
        buildScripts: helpers.getIosDefaultBuildScripts(),
      },
    },
  },
};
const defaultPrefs = {
  general: {
    outputPath: '{{userRootDir}}/Desktop',
    outputNamePattern:
      '{{appName}}-{{appPlatform}-{{appVariant}}-V{{versionName}}-B{{buildNumber}}.{{appExtension}}',
    cleanOutputPathBeforeBuild: true,
    shouldNotifyAfterBuild: true,
    preventSystemSleepDuringBuild: false,
  },
  diawiDeploy: {
    enable: true,
    apiToken: '',
    callbackEmails: '',
    callbackUrl: '',
    installationNotifications: false,
    wallOfApps: false,
    findByUDID: false,
  },
  iosExport: {
    enable: false,
    overTheAirManifestUrl: '',
    overTheAirManifestDisplayImageUrl: '',
    overTheAirManifestFullImageUrl: '',
  },
  huaweiDeploy: {
    enable: false,
    appId: '',
    clientId: '',
    clientSecret: '',
  },
  appStoreDeploy: {
    enable: true,
    userName: '',
    appSpecificPassword: '',
  },
  googlePlayDeploy: {
    enable: true,
    pathToPlayStoreCredentialsJsonFile: '',
  },
  slackUpload: {
    enable: true,
    token: '',
  },
  googleDriveUpload: {
    enable: true,
    pathToCredentialsJsonFile: '',
  },
  // oneDriveUpload: {
  //   enable: true,
  // },
  iAppsDeploy: {
    enable: false,
  },
  anardooniDeploy: {
    enable: false,
  },
  sibcheDeploy: {
    enable: false,
  },
  sibAppDeploy: {
    enable: false,
  },
  sibIraniDeploy: {
    enable: false,
  },
  iranAppsDeploy: {
    enable: false,
  },
  charkhoneDeploy: {
    enable: false,
  },
  myketDeploy: {
    enable: false,
  },
  cafeBazaarDeploy: {
    enable: false,
  },
  sendViaWhatsApp: {
    enable: true,
  },
  sendViaTelegram: {
    enable: true,
    token: '',
  },
  dropBoxUpload: {
    enable: true,
    accessToken: '',
  },
};
const _configPath = `${helpers.getPathToRoot()}/easy-app-builder-config.json`;
let _settings = {};
let _prefs = {};

const updateConfigFile = function () {
  const config = {settings: _settings, prefs: _prefs};
  var json = JSON.stringify(config, null, 4);
  fs.writeFile(_configPath, json, 'utf8', function (err) {
    // alert(err);
  });
};

const loadConfigFile = function () {
  let data = undefined;

  try {
    data = fs.readFileSync(_configPath, 'utf8');
  } catch (error) {}

  return data;
};

const loadPrefs = () => {
  let data = loadConfigFile();

  let p;
  if (!data) p = defaultPrefs;
  else {
    const config = JSON.parse(data);
    p = config?.prefs || defaultPrefs;
  }
  updatePrefs(p);
};

loadPrefs();

const loadSettings = () => {
  let data = loadConfigFile();

  if (!data) _settings = defaultSettings;
  else {
    const config = JSON.parse(data);
    _settings = config?.settings || defaultSettings;
  }
};

loadSettings();

function updatePrefs(prefs) {
  _prefs = prefs;
  helpers.setOutputRootPath(prefs.general?.outputPath || '');
  helpers.setAppOutputNamePattern(prefs.general?.outputNamePattern);
}

function cloneObject(obj) {
  return JSON.parse(JSON.stringify(obj));
}

module.exports = {
  updateConfigFile,
  loadConfigFile,
  getSettings() {
    return cloneObject(_settings);
  },
  getAndroidSettings() {
    return cloneObject(_settings.android);
  },
  getIosSettings() {
    return cloneObject(_settings.ios);
  },
  updateSettings(settings) {
    _settings = settings;
  },
  getPrefs() {
    return cloneObject(_prefs);
  },
  getDiawiPrefs() {
    return cloneObject(_prefs.diawiDeploy);
  },
  getIosExportPrefs() {
    return cloneObject(_prefs.iosExport);
  },
  getAppStorePrefs() {
    return cloneObject(_prefs.appStoreDeploy);
  },
  getHuaweiPrefs() {
    return cloneObject(_prefs.huaweiDeploy);
  },
  getGooglePlayPrefs() {
    return cloneObject(_prefs.googlePlayDeploy);
  },
  getSlackPrefs() {
    return cloneObject(_prefs.slackUpload);
  },
  getGeneralPrefs() {
    return cloneObject(_prefs.general);
  },
  updatePrefs,
};
