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
const remote = require('@electron/remote');
const pie = require('puppeteer-in-electron');
const puppeteer = require('puppeteer-core');
const WhatsApp = require('whatsapp-web-electron.js');

let whatsAppClientReady = false;
let whatsAppClient;
let whatsappWindow;

const initWhatsAppClient = async () => {
  let SESSION_CONFIG_KEY = 'SESSION_CONFIG_KEY';
  let sessionCfg = localStorage.getItem(SESSION_CONFIG_KEY);
  if (sessionCfg) sessionCfg = JSON.parse(sessionCfg);

  const browser = await pie.connect(remote.app, puppeteer);

  whatsappWindow = new remote.BrowserWindow({
    width: 500,
    height: 700,
    webPreferences: {
      contextIsolation: false,
      nodeIntegration: true,
    },
  });

  setTimeout(() => {
    whatsappWindow.webContents.reloadIgnoringCache();
  }, 2000);

  whatsAppClient = new WhatsApp.Client(browser, whatsappWindow, {
    puppeteer: {
      takeoverOnConflict: true,
      takeoverTimeoutMs: 10000,
      headless: false,
      executablePath:
        'Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-extensions',
      ],
    },
    session: sessionCfg,
  });
  whatsAppClient.initialize();

  whatsAppClient.on('qr', qr => {
    // Generate and scan this code with your phone
    console.log('QR RECEIVED', qr);
  });

  whatsAppClient.on('authenticated', session => {
    console.log('AUTHENTICATED', session);
    sessionCfg = session;
    localStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(session));
  });

  whatsAppClient.on('ready', () => {
    console.log('Client is ready!');
    whatsAppClientReady = true;
    whatsappWindow.minimize();
  });

  // whatsAppClient.on('message', msg => {
  //   // if (msg.body == '!ping') {
  //   //   msg.reply('pong');
  //   // }

  //   console.log(msg);
  // });

  remote.getCurrentWindow().on('close', function () {
    whatsappWindow.destroy();
  });
};

const PERSIST_KEY = 'WHATSAPP';

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

let phoneNumber = '';
let message = '';
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
const phoneInput = document.getElementById('phoneInput');
const messageInput = document.getElementById('messageInput');
const progressText = document.getElementById('progress-text');
const errorMessage = document.getElementById('errorMessage');
const zipCheck = document.getElementById('zipCheck');

title.innerHTML = `Send ${_fileName} via WhatsApp`;

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

phoneInput.addEventListener('input', event => {
  phoneNumber = event.currentTarget.value;
});

messageInput.addEventListener('input', event => {
  message = event.currentTarget.value;
});

zipCheck.addEventListener('change', event => {
  zipFileBeforUpload = event.currentTarget.checked;
});

Array.from(btnClose).forEach(el => {
  // Do stuff here
  el.addEventListener('click', () => {
    whatsappWindow.destroy();
    remote.getCurrentWindow().close();
  });
});

async function startUploading() {
  if (!phoneNumber) {
    alert('Please enter your target phone number');
    return;
  }

  if (!whatsAppClientReady) {
    alert('WhatsApp client is not ready or authenticated');
    return;
  }

  persistConfig();

  let zipPath;
  try {
    if (zipFileBeforUpload) {
      setStep('proccess');
      zipPath = await zipFileAsync(_filePath);
    }

    const phone = phoneNumber.replace('+', '') + '@c.us';
    const media = WhatsApp.MessageMedia.fromFilePath(zipPath || _filePath);

    setStep('upload');
    const msg = await whatsAppClient.sendMessage(phone, media);

    if (message) await msg.reply(message);

    setStep('success');
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
    JSON.stringify({phoneNumber, zipFileBeforUpload}),
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

  phoneNumber = config.phoneNumber;
  zipFileBeforUpload = config.zipFileBeforUpload;

  phoneInput.value = phoneNumber;
  zipCheck.checked = zipFileBeforUpload;
}

bind();
initWhatsAppClient();
setStep('info');
