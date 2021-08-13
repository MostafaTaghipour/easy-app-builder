const helpers = require('./js/helpers');
const configs = require('./js/constants/configs');
const {
  getParameterByName,
  wait,
  unzipFile,
  removeDirAsync,
} = require('./js/helpers/utils');
const shell = require('./js/helpers/shell');
const AppInfoParser = require('app-info-parser');
var adb = require('adbkit');
var adbClient = adb.createClient();
const {Simctl} = require('node-simctl');
const {writeFileSync} = require('fs');
const remote = require('@electron/remote');
const simctl = new Simctl();

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;
const _platform = _fileName.endsWith('.apk') ? 'android' : 'ios';
let _done = false;

const title = document.getElementById('title');
const btnCancel = document.getElementById('btnCancel');
const logs = document.getElementById('logs');

title.innerHTML = `Installing ${_fileName} on ${
  _platform == 'android' ? 'Device/Emulator' : 'Device'
}`;

btnCancel.addEventListener('click', async () => {
  if (!_done) {
    log('***** Canceled *****');
    await wait(2000);
  }
  shell.killCurrentProcess();
  close();
});

function log(text) {
  if (_done) return;
  logs.innerHTML += `<span>${text}</span>`;
}

async function close() {
  remote.getCurrentWindow().close();
}

async function installApkOnDevice(fileName, path, id, name) {
  try {
    async function installInFirstDevice() {
      try {
        log('Detecting Active Device ...');
        const devices = await adbClient.listDevices();
  
        if (devices.length > 0) {
          const device = devices[0];
          log(`Trying to Install ${name} on ${device.id} ...`);
          await adbClient.install(device.id, path);

          await wait(2000);

          log(`Trying to launch ${name} ...`);
          await shell.executeCommand(
            `adb shell monkey -p ${id} -c android.intent.category.LAUNCHER 1`,
          );
          return true;
        } else {
          log('No Active Device found');
          return false;
        }
      } catch (error) {
        console.error(error);
      }
    }

    const installed = await installInFirstDevice();

    await wait(1000);
    if (
      !installed &&
      confirm('There is no connected device, do you want to start an emulator?')
    ) {
      log('Trying to start Emulator ...');
      let emulatorName;
      await shell.executeCommand(
        'cd ~/Library/Android/sdk/emulator && ./emulator -list-avds',
        em => {
          if (!emulatorName && em) {
            emulatorName = em;
          }
        },
      );

      if (emulatorName)
        try {
          shell.executeCommand(
            `cd ~/Library/Android/sdk/emulator && ./emulator -avd ${emulatorName}`,
          );
        } catch (error) {}

      await wait(5000);
      await installInFirstDevice();
    }

    log('***** Done *****');
  } catch (error) {
    log(`***** Error: ${error.message} *****`);
  }
}
async function installIpaOnDevice(fileName, path, id, name) {
  try {
    log('Detecting Active Device ...');
    let data = '';
    try {
      await shell.executeCommand('instruments -s devices', d => {
        data = d;
      });
    } catch (error) {
      console.error(error);
    }
    let activeDeviceId = data
      .split(/\r?\n/)
      .filter(Boolean)
      .filter(x => !x.includes('Simulator'))
      .filter(x => x.includes('iPhone'))
      .map(x => x.replace(/(^.*\[|\].*$)/g, ''))
      ?.shift();

    if (activeDeviceId) {
      // let iosDeployExist = await shell.commandExist('ios-deploy');

      // if (iosDeployExist) {
      const outputPath = path.replace(fileName, '');

      log(`Trying to Install ${name} on ${activeDeviceId} ...`);

      await unzipFile(path, outputPath);

      await wait(3000);

      try {
        await shell.executeCommand(
          `ios-deploy --bundle ${outputPath}/Payload/*.app`,
        );
      } catch (error) {}

      await removeDirAsync(`${outputPath}/Payload`);
      // } else {
      //   alert(
      //     "To install app on device 'ios-deploy' required, Please install it using 'brew install ios-deploy' and try again",
      //   );
      // }
    } else {
      // let list = await simctl.list();
      // const activeSim = Object.keys(list.devices)
      //   .filter(key => /iOS/.test(key))
      //   ?.map(key => list.devices[key])
      //   ?.shift()
      //   .find(x => x.state == 'Booted');
      log('No Active Device found');
    }

    log('***** Done *****');
  } catch (error) {
    log(`***** Error: ${error.message} *****`);
  } finally {
  }
}

async function startInstalling() {
  const parser = new AppInfoParser(_filePath, false);
  const info = await parser.parse();

  let id, name;

  if (_platform == 'android') {
    id = info.package;
    name = info.application.label[0];
  } else {
    id = info.CFBundleIdentifier;
    name = info.CFBundleDisplayName || info.CFBundleExecutable;
  }

  if (_platform == 'android') {
    await installApkOnDevice(_fileName, _filePath, id, name);
  } else {
    await installIpaOnDevice(_fileName, _filePath, id, name);
  }

  _done = true;

  btnCancel.innerHTML = 'Close';
}

startInstalling();
