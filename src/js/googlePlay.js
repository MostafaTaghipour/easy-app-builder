const helpers = require('./js/helpers');
const fs = require('fs');
const configs = require('./js/constants/configs');
const {getParameterByName} = require('./js/helpers/utils');
const remote = require('@electron/remote');

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

const auth = helpers.replacePlaceHolders(
  configs.getGooglePlayPrefs().pathToPlayStoreCredentialsJsonFile,
);
const authJSON = JSON.parse(fs.readFileSync(auth));

const publisher = require('playup')(authJSON);

let changesEN = '';
let changesFA = '';

const title = document.getElementById('title');
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
const errorMessage = document.getElementById('errorMessage');

title.innerHTML = `Deploy ${_fileName} on GooglePlay`;

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

Array.from(btnClose).forEach(el => {
  // Do stuff here
  el.addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
});

changesEnInput.addEventListener('input', event => {
  changesEN = event.currentTarget.value;
});

changesFaInput.addEventListener('input', event => {
  changesFA = event.currentTarget.value;
});

async function startUploading() {
  options = {
    // obbs: [
    //   // optional expansion files (max 2)
    //   '/path/to/somefile.obb',
    // ],
    recentChanges: {
      'en-US': changesEN,
      'fa-IR': changesFA,
    },
  };

  setStep('upload');

  try {
    const data = await publisher.upload(_filePath, options);

    if (data) {
      console.log(
        ' > %s version %d is up!',
        data.packageName,
        data.versionCode,
      );

      setStep('success');
    } else {
      setStep('fail');
    }
  } catch (error) {
    errorMessage.innerHTML = error.message;
    setStep('fail');
  }
}

setStep('info');
