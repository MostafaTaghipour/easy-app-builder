const helpers = require('./js/helpers');
const configs = require('./js/constants/configs');
const constants = require('./js/constants');
const prompt = require('electron-prompt');

let _settings = configs.getSettings();

var androidBox = document.getElementById('android');
var androidAppName = document.getElementById('android-app-name');
var androidVersion = document.getElementById('android-version');
var androidBuildNumber = document.getElementById('android-build-number');
var androidBuildCheck = document.getElementById('android-build-check');
var androidCleanCheck = document.getElementById('android-clean-check');
var androidNewBuildButton = document.getElementById('btn-android-new-build');

var iosScriptsAfterBuildInput = document.getElementById(
  'ios-scripts-after-build-input',
);
var iosScriptsBeforeBuildInput = document.getElementById(
  'ios-scripts-before-build-input',
);
var androidScriptsAfterBuildInput = document.getElementById(
  'android-scripts-after-build-input',
);
var androidScriptsBeforeBuildInput = document.getElementById(
  'android-scripts-before-build-input',
);
var iosBox = document.getElementById('ios');
var iosAppName = document.getElementById('ios-app-name');
var iosVersion = document.getElementById('ios-version');
var iosBuildNumber = document.getElementById('ios-build-number');
var iosBuildCheck = document.getElementById('ios-build-check');
var iosCleanCheck = document.getElementById('ios-clean-check');
var iosPodCheck = document.getElementById('ios-pod-check');
var iosNewBuildButton = document.getElementById('btn-ios-new-build');

var buildButton = document.getElementById('btn-build');

function onBuildItemSwitchClick(event, platform, name) {
  if (event.currentTarget.checked)
    event.currentTarget.parentNode.parentNode.parentNode.parentNode.classList.remove(
      'disabled',
    );
  else
    event.currentTarget.parentNode.parentNode.parentNode.parentNode.classList.add(
      'disabled',
    );

  _settings[platform].variants[name].enable = event.currentTarget.checked;

  handleBuildButtonEnable();
}

function onBuildItemSettingsClick(event, platform, name) {
  event.currentTarget.parentNode.parentNode.parentNode
    .querySelector('.settings')
    .classList.toggle('hide');
}

function onChangePreScripts(event, platform, name) {
  const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

  _settings[platform].variants[name].preScripts = scripts;
}

function onChangePostScripts(event, platform, name) {
  const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

  _settings[platform].variants[name].postScripts = scripts;
}

function onChangeBuildScripts(event, platform, name) {
  const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

  _settings[platform].variants[name].buildScripts = scripts;
}

function onBuildItemDeleteClick(event, platform, name) {
  event.currentTarget.parentNode.parentNode.parentNode.remove();

  delete _settings[platform].variants[name];

  handleBuildButtonEnable();
}

function onOverTheAirCheckClick(event, name) {
  const checked = event.currentTarget.checked;

  _settings.ios.variants[name].overTheAir = checked;
}

function onIosDistributionMethodChnage(event, name) {
  const selectedValue = event.currentTarget.value;

  event.currentTarget.parentNode.querySelector('.dist-method-desc').innerHTML =
    constants.IOS_DISTRIBUTION_METHODS[selectedValue].description;

  event.currentTarget.parentNode.querySelector('.over-the-air').style.display =
    selectedValue == 'adHoc' ? 'flex' : 'none';

  _settings.ios.variants[name].distributionMethod = selectedValue;
}

const handleBuildButtonEnable = () => {
  let enable = false;

  const androidEnableVarientsCount = Object.values(
    _settings.android.variants,
  ).filter(x => x.enable).length;
  const iosEnableVarientsCount = Object.values(_settings.ios.variants).filter(
    x => x.enable,
  ).length;

  if (
    (_settings.android.enable && androidEnableVarientsCount > 0) ||
    (_settings.ios.enable && iosEnableVarientsCount > 0)
  )
    enable = true;

  buildButton.disabled = !enable;
};

const bindUI = () => {
  const androidSetting = _settings.android;
  const iosSetting = _settings.ios;

  androidAppName.innerHTML = helpers.getAndroidAppName();
  androidBuildNumber.innerHTML = helpers.getAndroidVersionCode();
  androidVersion.innerHTML = helpers.getAndroidVersionName();

  iosAppName.innerHTML = helpers.getIosAppName();
  iosBuildNumber.innerHTML = helpers.getIosBuildNumber();
  iosVersion.innerHTML = helpers.getIosVersionName();

  androidBuildCheck.checked = androidSetting.enable;
  androidCleanCheck.checked = androidSetting.clean;
  iosBuildCheck.checked = iosSetting.enable;
  iosCleanCheck.checked = iosSetting.clean;
  iosPodCheck.checked = iosSetting.pod;

  androidScriptsBeforeBuildInput.innerHTML = (
    androidSetting.preScripts || ''
  ).join('\n');
  androidScriptsAfterBuildInput.innerHTML = (
    androidSetting.postScripts || ''
  ).join('\n');
  iosScriptsBeforeBuildInput.innerHTML = (iosSetting.preScripts || '').join(
    '\n',
  );
  iosScriptsAfterBuildInput.innerHTML = (iosSetting.postScripts || '').join(
    '\n',
  );

  if (androidSetting.enable) {
    androidBox.classList.remove('disabled');
  } else {
    androidBox.classList.add('disabled');
  }

  if (iosSetting.enable) {
    iosBox.classList.remove('disabled');
  } else {
    iosBox.classList.add('disabled');
  }

  let androidItems = '';
  for (const [variantName, variant] of Object.entries(
    androidSetting.variants,
  )) {
    androidItems += `
        <div class="build-item ${variant.enable ? '' : 'disabled'}">
        <div class="row">
            <label>${variantName}</label>
            <div class="spacer"></div>
            <div class="row">
                <img class="icon mr-10" id="${variantName.toLowerCase()}-build-remove-button" title="Remove this flavor" onclick="onBuildItemDeleteClick(event,'android','${variantName}')"
                    src="./assets/images/ic_trash.png" />
                <img class="icon mr-10" id="android-${variantName.toLowerCase()}--build-settings-button" onclick="onBuildItemSettingsClick(event,'android','${variantName}')"
                    title="Change settings for this flavor" src="./assets/images/ic_gear.png" />

                <label class="switch small">
                    <input type="checkbox" ${
                      variant.enable ? 'checked' : ''
                    } id="android-${variantName.toLowerCase()}--build-check"  onclick="onBuildItemSwitchClick(event,'android','${variantName}')">
                    <span></span>
                </label>
            </div>
        </div>
        <div class="col settings hide">

            <div class="col title-and-desc">
                <label>Build scripts</label>
                <span>Put your build scripts here, each script should be in separate line, you can also use <a
                        href="./help.html#placeholders"
                        target="_blank">Placeholders</a> in your scripts.</span>
            </div>
            <textarea id="android-${variantName.toLowerCase()}--build-scripts" rows="3" class="script"
                onkeyup="onChangeBuildScripts(event,'android','${variantName}')" >${(
      variant.buildScripts || ''
    ).join('\n')}</textarea>

        </div>
    </div>
    `;
  }
  androidBox.querySelector('.build-items').innerHTML = androidItems;

  let iosItems = '';
  for (const [variantName, variant] of Object.entries(iosSetting.variants)) {
    //   let methodSelect = `<select onchange="onIosDistributionMethodChnage(event,'${variantName}')">`;

    //   for (const [methodKey, method] of Object.entries(
    //     constants.IOS_DISTRIBUTION_METHODS,
    //   )) {
    //     methodSelect += `<option value="${methodKey}" ${
    //       variant.distributionMethod == methodKey ? 'selected' : ''
    //     } >
    //           <div class="col">${method.title}</div>
    //         </option>`;
    //   }

    //   methodSelect += '</select>';

    //   const distMethod = ` <div class="col dist-method">
    //   <label>Distribution Method</label>
    //   ${methodSelect}

    //   <span class="dist-method-desc">${
    //     constants.IOS_DISTRIBUTION_METHODS[variant.distributionMethod].description
    //   }</span>

    //   <div class="row over-the-air" style="display:${
    //     variant.distributionMethod == 'adHoc' ? 'flex' : 'none'
    //   }">

    //         <input type="checkbox" ${
    //           variant.overTheAir ? 'checked' : ''
    //         } onclick="onOverTheAirCheckClick(event, '${variantName}')" />
    //         <div class="col">
    //           <div class="row"><h6>Include manifest for over-the-air installation</h6> <a href="https://medium.com/@adrianstanecki/distributing-and-installing-non-market-ipa-application-over-the-air-ota-2e65f5ea4a46" class="help-link ml-10" target="_blank"> <img src="./assets/images/ic_help.png" > </a></div>
    //           <span>Users can download your app using Safari.</span>
    //           <span>* Make sure you set fields below iOS Export over-the-air installation section in <a href="./preferences.html" target="_blank">Preferences</a> </span>
    //         </div>

    //   </div>
    // </div>`;

    iosItems += `
        <div class="build-item ${variant.enable ? '' : 'disabled'}">
        <div class="row">
            <label>${variantName}</label>
            <div class="spacer"></div>
            <div class="row">
                <img class="icon mr-10" id="ios-${variantName.toLowerCase()}-build-remove-button" title="Remove this flavor" onclick="onBuildItemDeleteClick(event,'ios','${variantName}')"
                    src="./assets/images/ic_trash.png" />
                <img class="icon mr-10" id="ios-${variantName.toLowerCase()}--build-settings-button" onclick="onBuildItemSettingsClick(event,'ios','${variantName}')"
                    title="Change settings for this flavor" src="./assets/images/ic_gear.png" />

                <label class="switch small">
                    <input type="checkbox" ${
                      variant.enable ? 'checked' : ''
                    } id="ios-${variantName.toLowerCase()}--build-check"  onclick="onBuildItemSwitchClick(event,'ios','${variantName}')">
                    <span></span>
                </label>
            </div>
        </div>
        <div class="col settings hide">

           
            <div class="col title-and-desc">
              <label>Build scripts</label>
              <span>Put your build scripts here, each script should be in separate line, you can also use <a
                      href="./help.html#placeholders"
                      target="_blank">Placeholders</a> in your scripts.</span>
            </div>
            <textarea id="ios-${variantName.toLowerCase()}--build-scripts" rows="3" class="script"
            onkeyup="onChangeBuildScripts(event,'ios','${variantName}')" >${(
      variant.buildScripts || ''
    ).join('\n')}</textarea>
           
        </div>
    </div>
    `;
  }
  iosBox.querySelector('.build-items').innerHTML = iosItems;
};

const handleChanges = () => {
  androidBuildCheck.addEventListener('change', event => {
    updateSettings();
    if (event.currentTarget.checked) {
      androidBox.classList.remove('disabled');
    } else {
      androidBox.classList.add('disabled');
    }
    handleBuildButtonEnable();
  });
  androidCleanCheck.addEventListener('change', event => {
    updateSettings();
  });

  iosCleanCheck.addEventListener('change', event => {
    updateSettings();
  });
  iosBuildCheck.addEventListener('change', event => {
    updateSettings();
    if (event.currentTarget.checked) {
      iosBox.classList.remove('disabled');
    } else {
      iosBox.classList.add('disabled');
    }
    handleBuildButtonEnable();
  });
  iosPodCheck.addEventListener('change', event => {
    updateSettings();
  });

  buildButton.addEventListener('click', event => {
    configs.updateSettings(_settings);
    configs.updateConfigFile();
    location.href = './building.html';
  });

  androidScriptsBeforeBuildInput.addEventListener('input', event => {
    const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

    _settings.android.preScripts = scripts;
  });
  androidScriptsAfterBuildInput.addEventListener('input', event => {
    const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

    _settings.android.postScripts = scripts;
  });
  iosScriptsBeforeBuildInput.addEventListener('input', event => {
    const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

    _settings.ios.preScripts = scripts;
  });
  iosScriptsAfterBuildInput.addEventListener('input', event => {
    const scripts = event.currentTarget.value.split(/\r?\n/).filter(Boolean);

    _settings.ios.postScripts = scripts;
  });

  androidNewBuildButton.addEventListener('click', async event => {
    var flavor = await prompt({
      title: 'New Flavor Build',
      label: 'Please enter your flavor name',
    });

    if (!flavor) return;

    _settings.android.variants[flavor] = {
      enable: true,
      buildScripts: helpers.getAndroidDefaultBuildScripts('{{appVariant}}'),
    };

    bindUI();
    handleBuildButtonEnable();
  });

  iosNewBuildButton.addEventListener('click', async event => {
    var scheme = await prompt({
      title: 'New Scheme Build',
      label: 'Please enter your scheme name',
    });

    if (!scheme) return;

    _settings.ios.variants[scheme] = {
      enable: true,
      buildScripts: helpers.getIosDefaultBuildScripts('{{appVariant}}'),
      // distributionMethod: 'adHoc',
      // overTheAir: false,
    };

    bindUI();
    handleBuildButtonEnable();
  });
};

const updateSettings = () => {
  _settings.android.enable = androidBuildCheck.checked;
  _settings.android.clean = androidCleanCheck.checked;
  _settings.ios.enable = iosBuildCheck.checked;
  _settings.ios.clean = iosCleanCheck.checked;
  _settings.ios.pod = iosPodCheck.checked;
};

bindUI();
handleChanges();
handleBuildButtonEnable();

/*

android : 
 - help
 - tutorial
 - upload to onedrive , googledrive, dropbox 
 - upload to slack
 - send via whatsapp
 - electron copy to clipboard, save file , copy image

*/
