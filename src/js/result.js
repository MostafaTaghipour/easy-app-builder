const configs = require('./js/constants/configs');
const {getAllFiles} = require('./js/helpers/utils');
const helpers = require('./js/helpers');
const shell = require('./js/helpers/shell');
const exp = require('./js/helpers/export');
const AppInfoParser = require('app-info-parser');
const remote = require('@electron/remote');
const fs = require('fs');
const os = require('os');
const request = require('request');


const btnReload = document.getElementById('btnReload');


btnReload?.addEventListener('click', () => {
  remote.getCurrentWindow().webContents.reloadIgnoringCache();
});


const _outputPath = helpers.getOutputPath();
const _items = [];

let _rendered = false;

function showInDirectory(event, path) {
  shell.dirOpen(path);
}
function showMore(event) {
  event.currentTarget.parentNode.parentNode.parentNode
    .querySelector('.panel')
    .classList.toggle('hide');
}

function newWindow(page, file) {
  const window = new remote.BrowserWindow({
    width: 700,
    height: 550,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
  });

  window.loadFile(`${__dirname}/${page}`, {
    query: {
      file,
    },
  });
}

function diawiClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getDiawiPrefs().apiToken) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "Diawi deploy" section, set api token.',
    );
    return;
  }

  newWindow(`diawi.html`, item.fileName);
}

async function whatsappClick(event, index) {
  const item = _items[index];
  if (!item) return;

  newWindow(`whatsApp.html`, item.fileName);
}
async function googleDriveClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getPrefs().googleDriveUpload.pathToCredentialsJsonFile) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "GoogleDrive Upload" section, set Credentials Json File',
    );
    return;
  }

  newWindow(`googleDrive.html`, item.fileName);
}
async function oneDriveClick(event, index) {
  const item = _items[index];
  if (!item) return;

  request.post(
    'https://login.live.com/oauth20_token.srf',
    {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        'cache-control': 'no-cache',
      },
      formData: {
        response_type: 'code',
        client_id: '80301600-7b8b-4ad6-ac34-bbb706b5c8cf',
        redirect_uri: 'http://localhost:3000',
        client_secret: 'd~UZOt253RSt6uGz.J_hkc99sHGY0U~E5b',
        scope: 'https://graph.microsoft.com/.default',
      },
    },
    (err, res, body) => {
      console.log(err, res, body);
    },
  );

  // if (!configs.getDiawiPrefs().apiToken) {
  //   alert(
  //     'Please go to Easy App Builder > Preferences, under Diawi deploy section, set api token.',
  //   );
  //   return;
  // }

  //  newWindow(`slack.html`, item.fileName);
}
async function dropBoxClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getPrefs().dropBoxUpload.accessToken) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "DropBox Upload" section, set Access Token',
    );
    return;
  }

  newWindow(`dropBox.html`, item.fileName);
}
async function slackClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getSlackPrefs().token) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "Upload to Slack" section, set token.',
    );
    return;
  }

  newWindow(`slack.html`, item.fileName);
}

async function telegramClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getPrefs().sendViaTelegram.token) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "Send via Telegram" section, set token.',
    );
    return;
  }

  newWindow(`telegram.html`, item.fileName);
}

async function installClick(event, index) {
  const item = _items[index];
  if (!item) return;

  newWindow(`install.html`, item.fileName);
}

async function otaClick(event, index) {
  const item = _items[index];
  if (!item) return;
  const {
    overTheAirManifestUrl,
    overTheAirManifestDisplayImageUrl,
    overTheAirManifestFullImageUrl,
  } = configs.getIosExportPrefs();

  if (
    !overTheAirManifestUrl ||
    !overTheAirManifestDisplayImageUrl ||
    !overTheAirManifestFullImageUrl
  ) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "iOS Over-The-Air Export" section, fill the fileds.',
    );
    return;
  }

  const data = await exp.iosOverTheAirManifest(
    item.id,
    item.name,
    item.version,
  );

  remote.dialog
    .showSaveDialog({defaultPath: `${os.homedir()}/Downloads/manifest.plist`})
    .then(file => {
      // Stating whether dialog operation was cancelled or not.
      console.log(file.canceled);
      if (!file.canceled) {
        console.log(file.filePath.toString());

        // Creating and Writing to the sample.txt file
        fs.writeFile(file.filePath.toString(), data, function (err) {
          if (err) throw err;
          console.log('Saved!');
        });
      }
    })
    .catch(err => {
      console.log(err);
    });
}

function googleClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (!configs.getGooglePlayPrefs().pathToPlayStoreCredentialsJsonFile) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "GooglePlay deploy" section, set Credentials Json File.',
    );
    return;
  }

  newWindow(`googlePlay.html`, item.fileName);
}
function appStoreClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (
    !configs.getAppStorePrefs().userName ||
    !configs.getAppStorePrefs().appSpecificPassword
  ) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "AppStore deploy" section, fill the fields.',
    );
    return;
  }

  newWindow(`appStore.html`, item.fileName);
}
function huaweiClick(event, index) {
  const item = _items[index];
  if (!item) return;

  if (
    !configs.getHuaweiPrefs().appId ||
    !configs.getHuaweiPrefs().clientId ||
    !configs.getHuaweiPrefs().clientSecret
  ) {
    alert(
      'Please go to "Easy App Builder > Preferences", under "Huawei AppGallery deploy" section, fill the fields.',
    );
    return;
  }

  newWindow(`huawei.html`, item.fileName);
}
function cafeBazarClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://pishkhan.cafebazaar.ir/account/login');
}
function charkhoneClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://seller.charkhoneh.com/');
}
function myketClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.myket.ir/');
}
function iranAppsClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.iranapps.ir/site/login');
}
function sibAppClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.sibapp.com/login');
}
function sibcheClick(event, index) {
  const item = _items[index];
  if (!item) return;
  electr.Shell.openExternal('https://sibche.com/login/');
}
function sibIraniClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.sibirani.com/login');
}
function anardooniClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.anardoni.com/login');
}
function iAppsClick(event, index) {
  const item = _items[index];
  if (!item) return;
  remote.shell.openExternal('https://developer.iapps.ir/');
}

async function load() {
  const files = await getAllFiles(_outputPath).filter(
    x => x.endsWith('.ipa') || x.endsWith('.apk'),
  );

  for (let [index, file] of files.entries()) {
    try {
      const parser = new AppInfoParser(file, false);
      const info = await parser.parse();
      const platform = file.endsWith('.apk') ? 'Android' : 'iOS';

      const item = {
        path: file,
        fileName: file.replace(/^.*[\\\/]/, ''),
        logo: info.icon,
        icon: `./assets/images/${platform.toLowerCase()}.png`,
        platform,
      };

      if (platform === 'Android') {
        item.id = info.package;
        item.name = info.application.label[0];
        item.version = info.versionName;
        item.build = info.versionCode;
        item.minimumOS = info.usesSdk.minSdkVersion;
        item.targetOS = info.usesSdk.targetSdkVersion;
      } else {
        item.id = info.CFBundleIdentifier;
        item.name = info.CFBundleDisplayName || info.CFBundleExecutable;
        item.version = info.CFBundleShortVersionString;
        item.build = +info.CFBundleVersion;
        item.minimumOS = +info.MinimumOSVersion;
        item.targetOS = +info.DTPlatformVersion;
      }

      _items.push(item);
    } catch (error) {
      console.log(error);
    }
  }
}

async function bindUI() {
  await load();

  const listEl = document.getElementById('list');
  const backButton = document.getElementById('back-button');

  let content = '';

  for (let [index, item] of _items.entries()) {
    let panel = `<div class="panel row hide">`;

    if (item.platform == 'Android') {
      panel += `
      <button class="button secondary-button small" onclick="installClick(event, ${index})" > <img src="./assets/images/ic_phones.png" /> Install on Device/Emulator</button>
      `;

      if (configs.getPrefs().diawiDeploy?.enable || false)
        panel += `
      <button class="button secondary-button small" onclick="diawiClick(event, ${index})" > <img src="./assets/images/ic_diawi.png" />  Deploy on Diawi</button>
      `;

      if (configs.getPrefs().googlePlayDeploy?.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="googleClick(event, ${index})" > <img src="./assets/images/ic_google_play.png" />  Deploy on GooglePlay</button>
      `;

      if (configs.getPrefs().cafeBazaarDeploy?.enable || false)
        panel += `
      <button  class="button secondary-button small last" onclick="cafeBazarClick(event, ${index})" > <img src="./assets/images/ic_bazar.png" />  Deploy on CafeBazaar</button>
      `;

      if (configs.getPrefs().huaweiDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="huaweiClick(event, ${index})" > <img src="./assets/images/ic_huawei.png" />  Deploy on AppGallery</button>
      `;

      if (configs.getPrefs().myketDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="myketClick(event, ${index})" > <img src="./assets/images/ic_myket.png" />  Deploy on Myket</button>
      `;

      if (configs.getPrefs().iranAppsDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="iranAppsClick(event, ${index})" > <img src="./assets/images/ic_iranapps.png" />  Deploy on IranApps</button>
      `;
      if (configs.getPrefs().charkhoneDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small last" onclick="charkhoneClick(event, ${index})" > <img src="./assets/images/ic_charkhoneh.png" />  Deploy on Charkhoneh</button>
      `;
      if (configs.getPrefs().slackUpload?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="slackClick(event, ${index})" > <img src="./assets/images/ic_slack.png" />Send to Slack</button>
      `;
      if (configs.getPrefs().sendViaTelegram.enable || false)
        panel += `
    <button  class="button secondary-button small" onclick="telegramClick(event, ${index})" > <img src="./assets/images/ic_telegram.png" /> Send Via Telegram</button>
  `;
      if (configs.getPrefs().sendViaWhatsApp?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="whatsappClick(event, ${index})" > <img src="./assets/images/ic_whatsapp.png" /> Send Via WhatsApp</button>
      `;
      if (configs.getPrefs().googleDriveUpload?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="googleDriveClick(event, ${index})" > <img src="./assets/images/ic_googledrive.png" />  Upload to GoogleDrive</button>
      `;
      if (configs.getPrefs().dropBoxUpload?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="dropBoxClick(event, ${index})" > <img src="./assets/images/ic_dropbox.png" />  Upload to DropBox</button>
      `;
      if (configs.getPrefs().oneDriveUpload?.enable || false)
        panel += `
        <button  class="button secondary-button small last" onclick="oneDriveClick(event, ${index})" > <img src="./assets/images/ic_onedrive.png" /> Upload To OneDrive</button>
      `;
    } else {
      panel += `
      <button class="button secondary-button small" onclick="installClick(event, ${index})" > <img src="./assets/images/ic_phones.png" /> Install on Device</button>
        `;

      if (configs.getPrefs().diawiDeploy?.enable || false)
        panel += `
    <button class="button secondary-button small" onclick="diawiClick(event, ${index})" > <img src="./assets/images/ic_diawi.png" />  Deploy on Diawi</button>
    `;

      if (configs.getPrefs().iosExport?.enable || false)
        panel += `
    <button class="button secondary-button small" onclick="otaClick(event, ${index})" > <img src="./assets/images/ic_ota.png" />  Generate Over The Air Manifest</button>
`;
      if (configs.getPrefs().appStoreDeploy?.enable || false)
        panel += `
    <button  class="button secondary-button small last" onclick="appStoreClick(event, ${index})" > <img src="./assets/images/ic_appstore.png" />  Deploy on AppStore</button>
`;
      if (configs.getPrefs().sibAppDeploy?.enable || false)
        panel += `
    <button  class="button secondary-button small" onclick="sibAppClick(event, ${index})" > <img src="./assets/images/ic_sibapp.png" />  Deploy on SibApp</button>
`;
      if (configs.getPrefs().sibcheDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="sibcheClick(event, ${index})" > <img src="./assets/images/ic_sibche.png" />  Deploy on Sibche</button>
`;
      if (configs.getPrefs().sibIraniDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="sibIraniClick(event, ${index})" > <img src="./assets/images/ic_sibirani.png" />  Deploy on SibIrani</button>
`;
      if (configs.getPrefs().anardooniDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small" onclick="anardooniClick(event, ${index})" > <img src="./assets/images/ic_anardooni.png" />  Deploy on Anardooni</button>
`;
      if (configs.getPrefs().iAppsDeploy?.enable || false)
        panel += `
        <button  class="button secondary-button small last" onclick="iAppsClick(event, ${index})" > <img src="./assets/images/ic_iapps.png" />  Deploy on iApps</button>
`;

      if (configs.getPrefs().slackUpload?.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="slackClick(event, ${index})" > <img src="./assets/images/ic_slack.png" />Send to Slack</button>
    `;
      if (configs.getPrefs().sendViaTelegram.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="telegramClick(event, ${index})" > <img src="./assets/images/ic_telegram.png" /> Send Via Telegram</button>
    `;
      if (configs.getPrefs().sendViaWhatsApp?.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="whatsappClick(event, ${index})" > <img src="./assets/images/ic_whatsapp.png" /> Send Via WhatsApp</button>
    `;
      if (configs.getPrefs().googleDriveUpload?.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="googleDriveClick(event, ${index})" > <img src="./assets/images/ic_googledrive.png" />  Upload to GoogleDrive</button>
    `;
      if (configs.getPrefs().dropBoxUpload?.enable || false)
        panel += `
      <button  class="button secondary-button small" onclick="dropBoxClick(event, ${index})" > <img src="./assets/images/ic_dropbox.png" />  Upload to DropBox</button>
    `;
      if (configs.getPrefs().oneDriveUpload?.enable || false)
        panel += `
      <button  class="button secondary-button small last" onclick="oneDriveUpload(event, ${index})" > <img src="./assets/images/ic_onedrive.png" /> Upload To OneDrive</button>
    `;
    }

    panel += `<span class="desc">* There are also other options you can go to the <a href="./preferences.html" >Preferences</a> and enable them.  </span>`;

    panel += `</div>`;

    content += `
    <div class="item">
      <div class="topSection row">
        <div class="logoSection">
          <img class="logo" src="${item.logo}" onError="this.onerror=null;this.src='./assets/images/application-placeholder.png';">
        </div>
        <div class="col infoSection">
          <h4 class="fileName">${item.fileName}</h4>
          <div class="row info"> <h6 class="title">${item.name}</h6> <h6 class="id">${item.id}</h6></div>
          <div class="row versionSection"><span>Version<strong>${item.version}</strong></span><span>Build Number<strong>${item.build}</strong></span></div>
          <div class="row os"><img class="icon" src="${item.icon}"> <span>Minimum<strong>${item.minimumOS}</strong></span><span>Target<strong>${item.targetOS}</strong></span></div>
        </div>
        <div class="actionSection row">
        <button class="button secondary-button small" onclick="showInDirectory(event, '${item.path}')" > <img src="./assets/images/ic_open_directory.png" />  Show in Directory</button>
        <button id="showMore"    title="Deployment options for this file"  class="button secondary-button small last" onclick="showMore(event)" > <img src="./assets/images/ic_more.png" /></button>
        </div>
      </div>
      ${panel}
    </div>
    `;
  }

  listEl.innerHTML = content;

  backButton.addEventListener('click', e => {
    remote.getCurrentWindow().loadFile(`${__dirname}/main.html`);
  });

  _rendered = true;
}

(async function () {
  try {
    while (!_rendered) {
      await bindUI();
    }
  } catch (error) {
    alert(error.message);
  }
})();
