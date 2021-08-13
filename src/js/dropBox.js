const helpers = require('./js/helpers');
const configs = require('./js/constants/configs');
const {
  getParameterByName,
  copyToClipboard,
  wait,
  zipFileAsync,
  removeFileAsync,
} = require('./js/helpers/utils');
const request = require('request');
const fs = require('fs');
const shell = require('./js/helpers/shell');
const remote = require('@electron/remote');
const DropBox = require('./js/helpers/DropBox');
const {showSnackBar} = require('./js/helpers/SnackBar');

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

const {accessToken} = configs.getPrefs().dropBoxUpload;

const dropBox = new DropBox(accessToken);

// let channels = '';
// let comment = '';
let zipFileBeforUpload = false;

const title = document.getElementById('title');
const progress = document.getElementById('progress');
const btnUpload = document.getElementById('btnUpload');
const btnRetry = document.getElementById('btnRetry');
const btnClose = document.getElementsByClassName('btnClose');
const infoSection = document.getElementById('info-section');
const uploadSection = document.getElementById('upload-section');
const processSection = document.getElementById('proccess-section');
const successSection = document.getElementById('success-section');
const failSection = document.getElementById('fail-section');
const btnCopyUrl = document.getElementById('copyUrl');
// const channelsInput = document.getElementById('channelsInput');
// const commentInput = document.getElementById('commentInput');
const progressText = document.getElementById('progress-text');
const errorMessage = document.getElementById('errorMessage');
const zipCheck = document.getElementById('zipCheck');
const spanUrl = document.getElementById('url');

title.innerHTML = `Upload ${_fileName} to DropBox`;

function setStep(step) {
  infoSection.style.display = step === 'info' ? 'flex' : 'none';
  uploadSection.style.display = step === 'upload' ? 'flex' : 'none';
  processSection.style.display = step === 'proccess' ? 'flex' : 'none';
  successSection.style.display = step === 'success' ? 'flex' : 'none';
  failSection.style.display = step === 'fail' ? 'flex' : 'none';
  title.style.display =
    step === 'fail' || step === 'success' ? 'none' : 'block';
}

btnUpload.addEventListener('click', () => {
  startUploading();
});

btnRetry.addEventListener('click', () => {
  startUploading();
});

// channelsInput.addEventListener('input', event => {
//   channels = event.currentTarget.value;
// });

// commentInput.addEventListener('input', event => {
//   comment = event.currentTarget.value;
// });

btnCopyUrl.addEventListener('click', () => {
  remote.clipboard.writeText(_url);
  showSnackBar(document, 'Copied!');
});

zipCheck.addEventListener('change', event => {
  zipFileBeforUpload = event.currentTarget.checked;
});

Array.from(btnClose).forEach(el => {
  // Do stuff here
  el.addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
});

async function startUploading() {
  // if (!channels) {
  //   alert('Please enter your target Channel(s)');
  //   return;
  // }

  // persistConfig();

  let zipPath;
  try {
    if (zipFileBeforUpload) {
      setStep('proccess');
      zipPath = await zipFileAsync(_filePath);
    }

    setStep('upload');
    const {path_lower} = await dropBox.uploadFileAsync(zipPath || _filePath);
    const url = await dropBox.shareFileAsync(path_lower);

    if (url) {
      _url = url;

      spanUrl.innerHTML = _url;
      setStep('success');
    } else {
      setStep('fail');
    }
  } catch (error) {
    errorMessage.innerHTML = error.message;
    setStep('fail');
  } finally {
    if (zipPath) await removeFileAsync(zipPath);
  }
}

function persistConfig() {
  localStorage.setItem(
    PERSIST_KEY,
    JSON.stringify({channels, comment, zipFileBeforUpload}),
  );
}

function loadConfig() {
  const config = localStorage.getItem(PERSIST_KEY);

  if (!config) return undefined;

  return JSON.parse(config);
}

function bind() {
  // const config = loadConfig();

  // if (!config) return;

  // comment = config.comment;
  // channels = config.channels;
  // zipFileBeforUpload = config.zipFileBeforUpload;

  // commentInput.innerHTML = comment;
  // channelsInput.innerHTML = channels;
  zipCheck.checked = zipFileBeforUpload;
}

bind();
setStep('info');

// const KEYFILEPATH =
//   '/Users/mostafataghipour/Downloads/easy-app-builder-81b19f06da3d.json';
// const FILEPATH = '/Users/mostafataghipour/Downloads/ic_skydrive.png';
// const googleDrive = new GoogleDrive(KEYFILEPATH);

// async function uplaodToDrive() {
//   try {
//     const id = await googleDrive.uploadFileAsync(FILEPATH);
//     await googleDrive.shareFileAsync(id);
//     const fileInfo = await googleDrive.getFileInfoAsync(id);
//     alert(fileInfo.webViewLink);
//   } catch (error) {
//     alert(error.message);
//   }
// }
