const helpers = require('./js/helpers');
const exp = require('./js/helpers/export');
const {
  wait,
  removeDirAsync,
  makeDirIfNotExistAsync,
  getAllFiles,
  moveFileAsync,
  isExistsAsync,
  clearDirFilesAsync,
  removeFileAsync,
} = require('./js/helpers/utils');
const Queue = require('./js/helpers/Queue');
const shell = require('./js/helpers/shell');
const constants = require('./js/constants');
const notifier = require('node-notifier');
const configs = require('./js/constants/configs');
const stayAwake = require('stay-awake');
const remote = require('@electron/remote');

const itemsSection = document.getElementById('items');
const logSection = document.getElementById('logs');
const cancelBuildButton = document.getElementById('cancel-build-button');
const backButton = document.getElementById('back-button');
const openOutputButton = document.getElementById('open-output-button');
const resultButton = document.getElementById('result-button');

let _allLogs = [];
let _disableFocusBottom = false;
let _loading = false;
let _cancelAll = false;

const _outputPath = helpers.getOutputPath();
const _rootPath = helpers.getPathToRoot();
const _androidOutputApkDir = helpers.replacePlaceHolders(
  `${constants.PROJECT_ROOT_DIR_KEY}/android/app/build/outputs/apk`,
);
var buildQueue = new Queue();
let _settings = {};

/**
 * Prepare settings and scripts to build
 */
function loadSettings() {
  const androidSettings = configs.getAndroidSettings();
  if (androidSettings.enable) {
    const android = {
      clean: androidSettings.clean,
      preScripts: androidSettings.preScripts,
      postScripts: androidSettings.postScripts,
      variants: {},
    };

    for (const [variantName, variant] of Object.entries(
      androidSettings.variants,
    )) {
      if (variant.enable) {
        variant.buildScripts = variant.buildScripts;
        variant.outputName = helpers.getAppOutputName('Android', variantName);
        variant.platform = 'Android';
        variant.name = variantName;

        android.variants[variantName] = variant;
      }
    }

    if (Object.keys(android.variants).length > 0) _settings.android = android;
  }

  const iosSettings = configs.getIosSettings();
  if (iosSettings.enable) {
    const ios = {
      clean: iosSettings.clean,
      pod: iosSettings.pod,
      preScripts: iosSettings.preScripts,
      postScripts: iosSettings.postScripts,
      variants: {},
    };

    for (const [variantName, variant] of Object.entries(iosSettings.variants)) {
      if (variant.enable) {
        variant.buildScripts = variant.buildScripts;
        variant.outputName = helpers.getAppOutputName('iOS', variantName);
        variant.platform = 'iOS';
        variant.name = variantName;

        ios.variants[variantName] = variant;
      }
    }

    if (Object.keys(ios.variants).length > 0) _settings.ios = ios;
  }
}

/**
 * notify build done
 *
 * @param {*} variant
 */
function notifyBuildDone(variant) {
  const _outputFile = `${_outputPath}/${variant.outputName}`;

  const notif = new remote.Notification({
    title: 'BUILD SUCCESS :)',
    subtitle: `${variant.platform} ${variant.name} successfully built.`,
    icon: `${__dirname}/assets/images/${variant.platform.toLowerCase()}.png`,
  });

  notif.show();

  notif.on('click', function () {
    // Triggers if `wait: true` and user clicks notification
    shell.dirOpen(_outputFile);
  });
}

/**
 * Build an Android Flavor script
 *
 * @param {*} variant
 */
async function buildAndroidFlavor(variant) {
  let built = false;
  try {
    // await runScripts(variant.preScripts, variant.platform, variant.name);

    await runScripts(variant.buildScripts, variant.platform, variant.name);

    // await runScripts(variant.postScripts, variant.platform, variant.name);

    built = await isExistsAsync(`${_outputPath}/${variant.outputName}`);
  } catch (error) {
    console.error(error);
  } finally {
    return built;
  }
}

/**
 * Build an iOS Scheme script
 *
 * @param {*} variant
 */
async function buildIosScheme(variant) {
  let built = false;
  try {
    // await runScripts(variant.preScripts, variant.platform, variant.name);

    await runScripts(variant.buildScripts, variant.platform, variant.name);

    // await runScripts(variant.postScripts, variant.platform, variant.name);

    built = await isExistsAsync(`${_outputPath}/${variant.outputName}`);
  } catch (error) {
    console.error(error);
  } finally {
    return built;
  }
}

/**
 * Build Android/iOS Vairant Task
 *
 * @param {*} variant
 * @returns task
 */
function buildVariant(variant) {
  return new Promise(async resolve => {
    log('');
    log('');
    log(`*** START BUILDING "${variant.outputName}" ****`);
    setItemStatus(variant.outputName, 'inProgress');
    setItemActive(variant.outputName, true);
    let built = false;
    if (variant.platform.toLowerCase() === 'android') {
      built = await buildAndroidFlavor(variant);
    } else {
      built = await buildIosScheme(variant);
    }
    if (built) {
      if (configs.getGeneralPrefs().shouldNotifyAfterBuild) {
        notifyBuildDone(variant);
      }
      setItemStatus(variant.outputName, 'passed');
    } else setItemStatus(variant.outputName, 'canceled');
    setItemActive(variant.outputName, false);
    resolve();
  });
}

/**
 * Start building variants
 *
 * @param {*} variants
 * @returns build variant promise
 */
async function startBuildingVariants(variants) {
  return new Promise(resolve => {
    for (const [variantName, variant] of Object.entries(variants)) {
      buildQueue.push(buildVariant, {args: variant}, variant.outputName);
    }
    buildQueue.onComplete(() => {
      resolve();
    });
  });
}

/**
 * clean and create output directory
 */
async function prepareOutputDir() {
  log('*** PREPARING OUTPUT DIRECTORY ****');
  if (configs.getGeneralPrefs().cleanOutputPathBeforeBuild) {
    await removeDirAsync(_outputPath);
  }

  await makeDirIfNotExistAsync(_outputPath);
}

/**
 * clean unuseful output directory
 */
async function cleanOutputDir() {
  log('');
  log('');
  log('*** DELETE USELESS FILES IN OUTPUT DIRECTORY ****');
  await clearDirFilesAsync(_outputPath, ['ipa', 'apk']);
}

/**
 * run scripts async
 *
 * @param {*} scripts
 */
async function runScripts(scripts, platform, variantName) {
  if (_cancelAll) return;
  for (const script of scripts) {
    try {
      const scr = helpers.replacePlaceHolders(script, platform, variantName);

      console.log(`RUN SCRIPT: ${scr}`);
      await shell.executeCommand(scr, function (data) {
        log(data, 'nomatter');
      });
    } catch (error) {
      console.error(error);
    }
  }
}

function setStatus(loading) {
  _loading = loading;

  cancelBuildButton.style.display = _loading ? 'flex' : 'none';
  backButton.style.display = !_loading ? 'flex' : 'none';
  resultButton.style.display = !_loading ? 'flex' : 'none';
  openOutputButton.style.display = !_loading ? 'flex' : 'none';
}

/**
 * Start Building
 */
async function startBuilding() {
  try {
    stayAwake.prevent(function () {});

    setStatus(true);
    await prepareOutputDir();
    if (_settings.android) {
      if (_settings.android.clean) {
        log('');
        log('');
        log('*** CLEAN ANDROID ****');
        await runScripts(
          [`cd ${constants.PROJECT_ROOT_DIR_KEY}/android && ./gradlew clean`],
          'Android',
        );
      }
      if (_settings.android.preScripts && _settings.android.preScripts > 0) {
        log('');
        log('');
        log('*** RUN ANDROID PRE SCRIPTS ****');
        await runScripts(_settings.android.preScripts, 'Android');
      }
      if (!_cancelAll) await startBuildingVariants(_settings.android.variants);
      if (_settings.android.postScripts && _settings.android.postScripts > 0) {
        log('');
        log('');
        log('*** RUN ANDROID POST SCRIPTS ****');
        await runScripts(_settings.android.postScripts, 'Android');
      }
    }
    if (_settings.ios) {
      if (_settings.ios.clean) {
        log('');
        log('');
        log('*** CLEAN IOS ****');
        await runScripts(
          [
            `cd ${constants.PROJECT_ROOT_DIR_KEY}/ios && xcodebuild clean -workspace ${constants.PROJECT_NAME_KEY}.xcworkspace -scheme ${constants.PROJECT_NAME_KEY}`,
          ],
          'iOS',
        );
      }
      if (_settings.ios.pod) {
        log('');
        log('');
        log('*** INSTALL PODS ****');
        await runScripts(
          [`cd ${constants.PROJECT_ROOT_DIR_KEY}/ios && pod install`],
          'iOS',
        );
      }

      if (_settings.ios.preScripts && _settings.ios.preScripts > 0) {
        log('');
        log('');
        log('*** RUN IOS PRE SCRIPTS ****');
        await runScripts(_settings.ios.preScripts, 'iOS');
      }
      if (!_cancelAll) await startBuildingVariants(_settings.ios.variants);
      if (_settings.ios.postScripts && _settings.ios.postScripts > 0) {
        log('');
        log('');
        log('*** RUN IOS PRE SCRIPTS ****');
        await runScripts(_settings.ios.postScripts, 'iOS');
      }
    }
  } catch (error) {
    console.error(error);
  } finally {
    stayAwake.allow(function () {});
    cleanOutputDir();
    setStatus(false);

    setTimeout(() => {
      logResult();
    }, 100);
  }
}

/**
 * log in log section
 * @param {*} text
 * @param {*} className
 */
function log(text, className) {
  text = text.length > 250 ? text.substring(250) + ' ...' : text;

  _allLogs.push({text, className});

  _allLogs = _allLogs.slice(Math.max(_allLogs.length - 50, 0));

  let content = '';
  for (const item of _allLogs) {
    content += `<div class="log ${item.className || ''}">${item.text}</div>`;
  }

  logSection.innerHTML = content;

  setTimeout(() => {
    if (!_disableFocusBottom) logSection.scrollTop = logSection.scrollHeight;
  }, 500);
}

/**
 * clear log section
 */
function clearLog() {
  _allLogs = [];
  logSection.innerHTML = '';
}

/**
 * log building result
 */
function logResult() {
  clearLog();

  const files = getAllFiles(_outputPath).map(p => p.replace(/^.*[\\\/]/, ''));

  log(
    '************************************************************************',
  );
  log('************************* BUILDING DONE **************************');
  log(
    '************************************************************************',
  );
  log('');

  if (_settings.android)
    for (const [variantName, variant] of Object.entries(
      _settings.android.variants,
    )) {
      log(
        variant.outputName,
        files.includes(variant.outputName) ? 'success' : 'error',
      );
    }

  if (_settings.ios)
    for (const [variantName, variant] of Object.entries(
      _settings.ios.variants,
    )) {
      log(
        variant.outputName,
        files.includes(variant.outputName) ? 'success' : 'error',
      );
    }

  log('');
  log(
    '************************************************************************',
  );
  log(
    '************************************************************************',
  );
  log(
    '************************************************************************',
  );
}

/**
 * set item status in ui
 * @param {*} id
 * @param {*} status
 */
function setItemStatus(id, status) {
  document.getElementById(id).className = `item row ${status}`;
}

/**
 * active and inactive item in ui
 * @param {*} id
 * @param {*} active
 */
function setItemActive(id, active) {
  if (active) document.getElementById(id).classList.add('active');
  else document.getElementById(id).classList.remove('active');
}

/**
 * canceling current build item
 * @param {*} event
 * @param {*} id
 */
async function onCancelItemClick(id, showConfirm = true) {
  if (!showConfirm || confirm(`Are you sure to cancel "${id}" process?`)) {
    buildQueue.cancel(id);
    shell.killCurrentProcess();
    log('');
    log(`*** "${id}" CANCELED ****`, 'error');
    log('');
    setItemActive(id, false);

    const fileBuilt = await isExistsAsync(`${_outputPath}/${id}`);

    if (!fileBuilt) setItemStatus(id, 'canceled');
  }
}

/**
 * on build item click
 * @param {*} event
 * @param {*} id
 */
function onItemClick(event, id) {
  shell.dirOpen(`${_outputPath}/${id}`);
}

/**
 * bind ui from items
 */
function bindUI() {
  let items = [];
  if (_settings.android) {
    for (const [variantName, variant] of Object.entries(
      _settings.android.variants,
    )) {
      items += `<div class="item row" id="${
        variant.outputName
      }" onclick="onItemClick(event,'${variant.outputName}')">
      <img src="./assets/images/${variant.platform.toLowerCase()}.png" alt="" class="icon">
      <div class="col info">
          <h5 class="title">${variant.name}</h5>
          <span class="subtitle">${variant.outputName}</span>
      </div>
      <div class="status">
    
          <img src="./assets/images/building_animated.svg" alt="" class="building-icon">
          <img src="./assets/images/ic_clock.png" alt="" class="pending-icon">
          <img src="./assets/images/ic_ok.png" alt="" class="done-icon">
          <img src="./assets/images/ic_cancel.png" alt="" class="cancel-icon">

          <button class="button secondary-button small cancel " onclick="onCancelItemClick('${
            variant.outputName
          }')">Cancel</button>
      </div>
  </div>`;
    }
  }
  if (_settings.ios) {
    for (const [variantName, variant] of Object.entries(
      _settings.ios.variants,
    )) {
      items += `<div class="item row" id="${
        variant.outputName
      }" onclick="onItemClick(event,'${variant.outputName}')">
      <img src="./assets/images/${variant.platform.toLowerCase()}.png" alt="" class="icon">
      <div class="col info">
          <h5 class="title">${variant.name}</h5>
          <span class="subtitle">${variant.outputName}</span>
      </div>
      <div class="status">
    
      <img src="./assets/images/building_animated.svg" alt="" class="building-icon">
          <img src="./assets/images/ic_clock.png" alt="" class="pending-icon">
          <img src="./assets/images/ic_ok.png" alt="" class="done-icon">
          <img src="./assets/images/ic_cancel.png" alt="" class="cancel-icon">

          <button class="button secondary-button small cancel " onclick="onCancelItemClick('${
            variant.outputName
          }')">Cancel</button>
      </div>
  </div>`;
    }
  }

  itemsSection.innerHTML = items;

  var lastScrollTop = 0;
  logSection.addEventListener('scroll', function (e) {
    var st = e.currentTarget.scrollTop;
    if (st > lastScrollTop) {
      // downscroll code
      if (logSection.scrollTop <= logSection.scrollHeight - 100)
        _disableFocusBottom = false;
    } else {
      // upscroll code
      _disableFocusBottom = true;
    }
    lastScrollTop = st <= 0 ? 0 : st;
  });

  cancelBuildButton.addEventListener('click', e => {
    if (confirm('Are you sure to cancel build process?')) {
      if (_settings.android)
        for (const [variantName, variant] of Object.entries(
          _settings.android.variants,
        )) {
          onCancelItemClick(variant.outputName, false);
        }
      if (_settings.ios)
        for (const [variantName, variant] of Object.entries(
          _settings.ios.variants,
        )) {
          onCancelItemClick(variant.outputName, false);
        }

      _cancelAll = true;
      setStatus(false);
    }
  });
  backButton.addEventListener('click', e => {
    remote.getCurrentWebContents().goBack();
  });
  openOutputButton.addEventListener('click', e => {
    shell.dirOpen(_outputPath);
  });
  resultButton.addEventListener('click', e => {
    remote.getCurrentWindow().loadFile(`${__dirname}/result.html`);
  });
}

loadSettings();
bindUI();
startBuilding();
