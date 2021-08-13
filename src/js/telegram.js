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
const TelegramBot = require('node-telegram-bot-api');

const PERSIST_KEY = 'TELEGRAM';

const {token} = configs.getPrefs().sendViaTelegram;
const bot = new TelegramBot(token, {polling: true});

const _fileName = getParameterByName(global.location.search, 'file');
const _outputPath = helpers.getOutputPath();
const _filePath = `${_outputPath}/${_fileName}`;

let contact = '';
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
const contactInput = document.getElementById('contactInput');
const messageInput = document.getElementById('messageInput');
const progressText = document.getElementById('progress-text');
const errorMessage = document.getElementById('errorMessage');
const zipCheck = document.getElementById('zipCheck');

title.innerHTML = `Send ${_fileName} via Telegram`;

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

contactInput.addEventListener('input', event => {
  contact = event.currentTarget.value;
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
    remote.getCurrentWindow().close();
  });
});

async function startUploading() {
  if (!contact) {
    alert('Please enter your target contact');
    return;
  }

  persistConfig();

  let zipPath;
  try {
    if (zipFileBeforUpload) {
      setStep('proccess');
      zipPath = await zipFileAsync(_filePath);
    }

    setStep('upload');
    const msg = await bot.sendDocument(
      contact,
      fs.createReadStream(zipPath || _filePath),
    );

    if (message)
      bot.sendMessage(contact, message, {
        reply_to_message_id: msg.message_id,
      });

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
    JSON.stringify({contact, zipFileBeforUpload}),
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

  contact = config.contact;
  zipFileBeforUpload = config.zipFileBeforUpload;

  contactInput.value = contact;
  zipCheck.checked = zipFileBeforUpload;
}

bind();
setStep('info');
