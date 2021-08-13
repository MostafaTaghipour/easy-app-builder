const helpers = require('./js/helpers');
const configs = require('./js/constants/configs');
const {
  getParameterByName,
  copyToClipboard,
  wait,
} = require('./js/helpers/utils');
const request = require('request');
const fs = require('fs');
const remote = require('@electron/remote');
const Huawei = require('./js/helpers/Huawei');

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

const {clientId, clientSecret} = configs.getHuaweiPrefs();

const huawei = new Huawei(clientId, clientSecret);

let changesEN = '';
let changesFA = '';

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
const changesFaInput = document.getElementById('changesFaInput');
const changesEnInput = document.getElementById('changesEnInput');
const progressText = document.getElementById('progress-text');
const errorMessage = document.getElementById('errorMessage');

title.innerHTML = `Deploy ${_fileName} on Huawei AppGallery`;

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

changesEnInput.addEventListener('input', event => {
  changesEN = event.currentTarget.value;
});

changesFaInput.addEventListener('input', event => {
  changesFA = event.currentTarget.value;
});

Array.from(btnClose).forEach(el => {
  // Do stuff here
  el.addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
});

async function startUploading() {


  const {appId} = configs.getHuaweiPrefs();

  const releaseNotes = [];
  if (changesFA) releaseNotes.push({lang: 'fa-IR', note: changesFA});
  if (changesEN) releaseNotes.push({lang: 'en-US', note: changesEN});

  const options = {
    appId,
    releaseNotes,
  };
  setStep('upload');
  try {
    await huawei.uploadToHuaweiAsync(_filePath, options, prgs => {
      console.log(prgs);

      progressText.innerHTML = `Uploading ${prgs}%`;
      progress.style.width = `${prgs}%`;

      if (prgs >= 100) {
        setStep('proccess');
      }
    });

    setStep('success');
  } catch (error) {
    errorMessage.innerHTML = error.message;
    setStep('fail');
  }
}

setStep('info');
