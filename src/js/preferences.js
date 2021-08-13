const {remote, Notification} = require('electron');
const configs = require('./js/constants/configs');
const path = require('path');

var preventSleepCheck = document.getElementById('prevent-sleep-check');
var notifyCheck = document.getElementById('notify-check');
var cleanBuildCheck = document.getElementById('clean-output-check');
var outputPathInput = document.getElementById('input-output-path');
var outputNamePatternInput = document.getElementById(
  'input-output-name-pattern',
);
var inputDiawiToken = document.getElementById('input-diawi-token');
var inputDiawiCallbackEmails = document.getElementById(
  'input-diawi-callback-emails',
);
var inputDiawiCallbackUrl = document.getElementById('input-diawi-callback-url');
var diawiInstallationNotificationsCheck = document.getElementById(
  'diawi-installation-notifications-check',
);
var diawiFindByUdidCheck = document.getElementById('diawi-find-by-udid-check');
var diawiWallOfAppsCheck = document.getElementById('diawi-wall-of-apps-check');
var inputAppleTeamId = document.getElementById('input-apple-team-id');
var inputOverTheAirManifestUrl = document.getElementById(
  'input-over-the-air-manifest-url',
);
var inputOverTheAirManifestDisplayImage = document.getElementById(
  'input-over-the-air-manifest-display-image',
);
var inputOverTheAirManifestFullSizeImage = document.getElementById(
  'input-over-the-air-manifest-full-size-image',
);
var inputAppleUserName = document.getElementById('input-apple-user-name');
var inputAppleAppSpecificPassword = document.getElementById(
  'input-apple-app-specific-password',
);
var pathPlaystoreCredentialsJsonFile = document.getElementById(
  'path-playstore-credentials-json-file',
);
var pathToGoogleDriveCredentialsJsonFile = document.getElementById(
  'path-googledrive-credentials-json-file',
);
var saveButton = document.getElementById('btn-save');
var cancelButton = document.getElementById('btn-cancel');

var inputHuaweiAppId = document.getElementById('input-huawei-app-id');
var inputHuaweiClientId = document.getElementById('input-huawei-client-id');
var inputHuaweiClientSecret = document.getElementById(
  'input-huawei-client-secret',
);

var inputSlackToken = document.getElementById('input-slack-token');
var inputDropBoxToken = document.getElementById('input-dropbox-token');
var inputTelegramToken = document.getElementById('input-telegram-token');

let _prefs = configs.getPrefs();

function bindUI() {
  notifyCheck.checked = _prefs.general?.shouldNotifyAfterBuild;
  preventSleepCheck.checked = _prefs.general?.preventSystemSleepDuringBuild;
  cleanBuildCheck.checked = _prefs.general?.cleanOutputPathBeforeBuild;
  outputPathInput.value = _prefs.general?.outputPath || '';
  outputNamePatternInput.value = _prefs.general?.outputNamePattern || '';
  inputDiawiToken.value = _prefs.diawiDeploy?.apiToken || '';
  inputDiawiCallbackEmails.value = _prefs.diawiDeploy?.callbackEmails || '';
  inputDiawiCallbackUrl.value = _prefs.diawiDeploy?.callbackUrl || '';
  diawiInstallationNotificationsCheck.checked =
    _prefs.diawiDeploy?.installationNotifications;
  diawiFindByUdidCheck.checked = _prefs.diawiDeploy?.findByUDID;
  diawiWallOfAppsCheck.checked = _prefs.diawiDeploy?.wallOfApps;
  inputAppleTeamId.value = _prefs.iosExport?.appleTeamId || '';
  inputOverTheAirManifestUrl.value =
    _prefs.iosExport?.overTheAirManifestUrl || '';
  inputOverTheAirManifestDisplayImage.value =
    _prefs.iosExport?.overTheAirManifestDisplayImageUrl || '';
  inputOverTheAirManifestFullSizeImage.value =
    _prefs.iosExport?.overTheAirManifestFullImageUrl || '';
  inputAppleUserName.value = _prefs.appStoreDeploy?.userName || '';
  inputAppleAppSpecificPassword.value =
    _prefs.appStoreDeploy?.appSpecificPassword || '';
  pathPlaystoreCredentialsJsonFile.value =
    _prefs.googlePlayDeploy?.pathToPlayStoreCredentialsJsonFile || '';

  inputHuaweiAppId.value = _prefs.huaweiDeploy?.appId || '';
  inputHuaweiClientId.value = _prefs.huaweiDeploy?.clientId || '';
  inputHuaweiClientSecret.value = _prefs.huaweiDeploy?.clientSecret || '';

  inputSlackToken.value = _prefs.slackUpload?.token || '';

  inputDropBoxToken.value = _prefs.dropBoxUpload?.accessToken || '';
  inputTelegramToken.value = _prefs.sendViaTelegram?.token || '';

  pathToGoogleDriveCredentialsJsonFile.value =
    _prefs.googleDriveUpload?.pathToCredentialsJsonFile || '';
}

function handleChanges() {
  notifyCheck.addEventListener('change', event => {
    _prefs.general.shouldNotifyAfterBuild = event.currentTarget.checked;
  });
  preventSleepCheck.addEventListener('change', event => {
    _prefs.general.preventSystemSleepDuringBuild = event.currentTarget.checked;
  });

  cleanBuildCheck.addEventListener('change', event => {
    _prefs.general.cleanOutputPathBeforeBuild = event.currentTarget.checked;
  });

  outputPathInput.addEventListener('input', event => {
    _prefs.general.outputPath = event.currentTarget.value;
  });

  outputNamePatternInput.addEventListener('input', event => {
    _prefs.general.outputNamePattern = event.currentTarget.value;
  });

  inputDiawiToken.addEventListener('input', event => {
    _prefs.diawiDeploy.apiToken = event.currentTarget.value;
  });

  inputDiawiCallbackEmails.addEventListener('input', event => {
    _prefs.diawiDeploy.callbackEmails = event.currentTarget.value;
  });

  inputDiawiCallbackUrl.addEventListener('input', event => {
    _prefs.diawiDeploy.callbackUrl = event.currentTarget.value;
  });

  diawiInstallationNotificationsCheck.addEventListener('change', event => {
    _prefs.diawiDeploy.installationNotifications = event.currentTarget.checked;
  });

  diawiFindByUdidCheck.addEventListener('change', event => {
    _prefs.diawiDeploy.findByUDID = event.currentTarget.checked;
  });

  diawiWallOfAppsCheck.addEventListener('change', event => {
    _prefs.diawiDeploy.wallOfApps = event.currentTarget.checked;
  });

  inputAppleTeamId.addEventListener('input', event => {
    _prefs.iosExport.appleTeamId = event.currentTarget.value;
  });
  inputOverTheAirManifestUrl.addEventListener('input', event => {
    _prefs.iosExport.overTheAirManifestUrl = event.currentTarget.value;
  });
  inputOverTheAirManifestDisplayImage.addEventListener('input', event => {
    _prefs.iosExport.overTheAirManifestDisplayImageUrl =
      event.currentTarget.value;
  });
  inputOverTheAirManifestFullSizeImage.addEventListener('input', event => {
    _prefs.iosExport.overTheAirManifestFullImageUrl = event.currentTarget.value;
  });

  inputAppleUserName.addEventListener('input', event => {
    _prefs.appStoreDeploy.userName = event.currentTarget.value;
  });
  inputAppleAppSpecificPassword.addEventListener('input', event => {
    _prefs.appStoreDeploy.appSpecificPassword = event.currentTarget.value;
  });
  pathPlaystoreCredentialsJsonFile.addEventListener('input', event => {
    _prefs.googlePlayDeploy.pathToPlayStoreCredentialsJsonFile =
      event.currentTarget.value;
  });

  inputHuaweiAppId.addEventListener('input', event => {
    _prefs.huaweiDeploy.appId = event.currentTarget.value;
  });
  inputHuaweiClientId.addEventListener('input', event => {
    _prefs.huaweiDeploy.clientId = event.currentTarget.value;
  });
  inputHuaweiClientSecret.addEventListener('input', event => {
    _prefs.huaweiDeploy.clientSecret = event.currentTarget.value;
  });

  inputSlackToken.addEventListener('input', event => {
    _prefs.slackUpload.token = event.currentTarget.value;
  });

  inputDropBoxToken.addEventListener('input', event => {
    _prefs.dropBoxUpload.accessToken = event.currentTarget.value;
  });
  inputTelegramToken.addEventListener('input', event => {
    _prefs.sendViaTelegram.token = event.currentTarget.value;
  });

  pathToGoogleDriveCredentialsJsonFile.addEventListener('input', event => {
    _prefs.googleDriveUpload.pathToCredentialsJsonFile =
      event.currentTarget.value;
  });

  Array.from(document.querySelectorAll('.section-title .switch input')).forEach(
    el => {
      // Do stuff here
      el.addEventListener('change', event => {
        if (event.currentTarget.checked)
          event.currentTarget.parentNode.parentNode.parentNode.classList.remove(
            'disabled',
          );
        else
          event.currentTarget.parentNode.parentNode.parentNode.classList.add(
            'disabled',
          );

        const name = event.currentTarget.getAttribute('data-config-name');

        if (!_prefs[name]) _prefs[name] = {};

        _prefs[name].enable = event.currentTarget.checked;
      });
    },
  );

  for (const [configName, config] of Object.entries(_prefs)) {
    const checkbox = document.querySelector(
      `[data-config-name="${configName}"]`,
    );

    if (checkbox) {
      console.log(checkbox);
      checkbox.checked = config.enable;

      if (!config.enable)
        checkbox.parentNode.parentNode.parentNode.classList.add('disabled');
    }
  }

  saveButton.addEventListener('click', event => {
    updatePrefs();
    back();
  });
  cancelButton.addEventListener('click', event => {
    back();
  });
}

function back() {
  remote.getCurrentWebContents().goBack();
}

function updatePrefs() {
  configs.updatePrefs(_prefs);
  configs.updateConfigFile();
}

bindUI();
handleChanges();
