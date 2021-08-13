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
const {remote} = require('electron');

const upload_api = 'https://slack.com/api/files.upload';

let _interval;

const PERSIST_KEY = 'SLACK';

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

let channels = '';
let comment = '';
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
const channelsInput = document.getElementById('channelsInput');
const commentInput = document.getElementById('commentInput');
const progressText = document.getElementById('progress-text');
const errorMessage = document.getElementById('errorMessage');
const zipCheck = document.getElementById('zipCheck');

title.innerHTML = `Send ${_fileName} to Slack`;

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

channelsInput.addEventListener('input', event => {
  channels = event.currentTarget.value;
});

commentInput.addEventListener('input', event => {
  comment = event.currentTarget.value;
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

const uploadToSlackAsync = (filePath, options, onPrpgress) => {
  const {token, title, filetype, channels, initial_comment} = options;
  const fileName = filePath.replace(/^.*[\\\/]/, '');

  return shell.executeCommand(
    `curl -F file=@${filePath} ${
      initial_comment ? '-F "initial_comment=' + initial_comment + '"' : ''
    } -F channels=${channels} -H "Authorization: Bearer ${token}" ${upload_api}`,
  );

  // return new Promise(async (resolve, reject) => {
  //   try {

  //     const formData = {
  //       title,
  //       initial_comment,
  //       filename: fileName,
  //       filetype,
  //       channels,
  //       file: fs.createReadStream(filePath),
  //     };

  //     const fileSize = fs.lstatSync(filePath).size;

  //     const req = request.post(
  //       {
  //         url: upload_api,
  //         formData: this.formData,
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       },
  //       function (err, httpResponse, body) {
  //         if (_interval) clearInterval(_interval);

  //         if (err || !body || !httpResponse.statusCode !== 200) {
  //           reject(err);
  //         }

  //         // const result_json = JSON.parse(body);

  //         resolve();
  //       },
  //     );

  //     _interval = setInterval(function () {
  //       var dispatched = req.req.connection._bytesDispatched;
  //       let percent = Math.floor((dispatched * 100) / fileSize);
  //       console.dir('Uploaded: ' + percent + '%');
  //       if (onProgress) onProgress(percent);
  //     }, 250);
  //   } catch (error) {
  //     reject(error);
  //   }
  // });
};

async function startUploading() {
  if (!channels) {
    alert('Please enter your target Channel(s)');
    return;
  }

  persistConfig();

  let zipPath;
  try {

    if (zipFileBeforUpload) {
      setStep('proccess');
      zipPath = await zipFileAsync(_filePath);
    }

    const {token} = configs.getSlackPrefs();

    const targetChannels = channels.split(/\r?\n/).join(',');

    const options = {
      token,
      channels: targetChannels,
      initial_comment: comment,
    };
    setStep('upload');
    await uploadToSlackAsync(
      zipPath || _filePath,
      options,
      // prgs => {
      //   console.log(prgs);

      //   progressText.innerHTML = `Uploading ${prgs}%`;
      //   progress.style.width = `${prgs}%`;
      // },
    );

    if (zipPath) await removeFileAsync(zipPath);

    setStep('success');
  } catch (error) {
    errorMessage.innerHTML = error.message;
    setStep('fail');
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
  const config = loadConfig();

  if (!config) return;

  comment = config.comment;
  channels = config.channels;
  zipFileBeforUpload = config.zipFileBeforUpload;

  commentInput.innerHTML = comment;
  channelsInput.innerHTML = channels;
  zipCheck.checked = zipFileBeforUpload;
}

bind();
setStep('info');
