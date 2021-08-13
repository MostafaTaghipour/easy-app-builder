const helpers = require('./js/helpers');
const configs = require('./js/constants/configs');
const {getParameterByName, copyToClipboard} = require('./js/helpers/utils');
const {showSnackBar} = require('./js/helpers/snackBar');
const Diawi = require('./js/helpers/diawi');
const {remote, nativeImage} = require('electron');

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

let password = '';
let comment = '';

let _url = '';
let _qr = '';

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
const passwordInput = document.getElementById('passwordInput');
const commentInput = document.getElementById('commentInput');
const btnCopyUrl = document.getElementById('copyUrl');
const btnCopyQRUrl = document.getElementById('copyQrUrl');
const btnCopyQR = document.getElementById('copyQr');
const progressText = document.getElementById('progress-text');
const spanUrl = document.getElementById('url');
const imgQR = document.getElementById('qr');
const errorMessage = document.getElementById('errorMessage');

title.innerHTML = `Deploy ${_fileName} on Diawi`;

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

btnCopyUrl.addEventListener('click', () => {
  remote.clipboard.writeText(_url);
  showSnackBar(document, 'Copied!');
});

btnCopyQRUrl.addEventListener('click', () => {
  remote.clipboard.writeText(_qr);
  showSnackBar(document, 'Copied!');
});

btnCopyQR.addEventListener('click', async () => {
  const data = await fetch(_qr);
  const blob = await data.blob();
  await navigator.clipboard.write([
    new ClipboardItem({
      [blob.type]: blob,
    }),
  ]);

  showSnackBar(document, 'Copied!');
});

Array.from(btnClose).forEach(el => {
  // Do stuff here
  el.addEventListener('click', () => {
    remote.getCurrentWindow().close();
  });
});

passwordInput.addEventListener('input', event => {
  password = event.currentTarget.value;
});

commentInput.addEventListener('input', event => {
  comment = event.currentTarget.value;
});

const uploadToDiawiAsync = (filePath, options, onPrpgress) => {
  return new Promise((resolve, reject) => {
    const diawiCommand = new Diawi({path: filePath, ...options})
      .on('progress', function (percent) {
        if (onPrpgress) onPrpgress(percent);
      })
      .on('complete', function (url, qr) {
        resolve({url, qr});
      })
      .on('error', function (error) {
        reject(error);
      });

    diawiCommand.execute();
  });
};

async function startUploading() {
  const {
    apiToken,
    callbackEmails,
    callbackUrl,
    installationNotifications,
    wallOfApps,
    findByUDID,
  } = configs.getDiawiPrefs();

  const options = {
    token: apiToken,
    comment: comment,
    callback_emails: callbackEmails,
    callback_url: callbackUrl,
    password: password,
    installation_notifications: installationNotifications,
    wall_of_apps: wallOfApps,
    find_by_udid: findByUDID,
  };

  setStep('upload');
  try {
    const {url, qr} = await uploadToDiawiAsync(_filePath, options, prgs => {
      console.log(prgs);

      progressText.innerHTML = `Uploading ${prgs}%`;
      progress.style.width = `${prgs}%`;

      if (prgs >= 100) {
        setStep('proccess');
      }
    });

    if (url) {
      _url = url;
      _qr = qr;

      spanUrl.innerHTML = _url;
      imgQR.src = _qr;

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
