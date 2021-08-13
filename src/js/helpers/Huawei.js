const fs = require('fs');
const path = require('path');
var mime = require('mime-types');
const request = require('request');

const base_api = 'https://connect-api.cloud.huawei.com/api';

const Huawei = function (clientId, clientSecret) {
  if (!clientId || !clientSecret)
    throw new Error('clientId and clientSecret are required');

  this.clientId = clientId;
  this.clientSecret = clientSecret;

  this._tryToSubmitCount = 0;

  request.post(
    {
      url: `${base_api}/oauth2/v1/token`,
      json: {
        client_id: clientId,
        grant_type: 'client_credentials',
        client_secret: clientSecret,
      },
      headers: {
        'Content-Type': 'application/json',
      },
    },
    function (err, httpResponse, body) {
      if (err || !body || httpResponse.statusCode !== 200) {
        throw err;
      }

      const {access_token} = JSON.parse(body);

      if (!access_token) reject(new Error('No Access Token'));

      this.accessToken = access_token;
    },
  );
};

Huawei.prototype.updateReleaseNotesAsync = (lang, releaseNote) => {
  return new Promise(async (resolve, reject) => {
    request.put(
      {
        url: `${base_api}/oauth2/v1/token`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
          client_id: this.clientId,
        },
        json: {
          lang,
          newFeatures: releaseNote,
        },
      },
      function (err, httpResponse, body) {
        if (err || httpResponse.statusCode !== 200) {
          reject(err);
        }

        resolve();
      },
    );
  });
};

Huawei.prototype.getUploadUrlAsync = appId => {
  return new Promise(async (resolve, reject) => {
    request.get(
      {
        url: `${base_api}/publish/v2/upload-url?appId=${appId}&suffix=apk`,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          client_id: this.clientId,
        },
      },
      function (err, httpResponse, body) {
        if (err || !body || httpResponse.statusCode !== 200) {
          reject(err);
        }

        const {authCode, uploadUrl} = JSON.parse(body);

        if (!uploadUrl) reject(new Error('No Upload Url'));

        resolve({authCode, uploadUrl});
      },
    );
  });
};

Huawei.prototype.uploadApkToApiAsync = (
  authCode,
  uploadUrl,
  apkPath,
  onProgress,
) => {
  return new Promise(async (resolve, reject) => {
    const formData = {
      authCode,
      fileCount: 1,
      parseType: 0,
      file: fs.createReadStream(apkPath),
    };

    const fileSize = fs.lstatSync(apkPath).size;

    const req = request.post(
      {
        url: uploadUrl,
        formData: this.formData,
      },
      function (err, httpResponse, body) {
        if (_interval) clearInterval(_interval);

        if (err || !body || httpResponse.statusCode !== 200) {
          reject(err);
        }

        const result_json = JSON.parse(body);
        const fileInfoList = result_json?.result?.UploadFileRsp?.fileInfoList;
        let serverApkUrl = '';

        if (fileInfoList.length > 0) {
          serverApkUrl = fileInfoList[0]?.fileDestUlr;
        }

        if (!serverApkUrl) reject(new Error('No Server Apk Url'));

        resolve(serverApkUrl);
      },
    );

    _interval = setInterval(function () {
      var dispatched = req.req.connection._bytesDispatched;
      let percent = Math.floor((dispatched * 100) / fileSize);
      console.dir('Uploaded: ' + percent + '%');
      if (onProgress) onProgress(percent);
    }, 250);
  });
};

Huawei.prototype.updateAppFileInfoAsync = (appId, fileName, apkServerPath) => {
  return new Promise(async (resolve, reject) => {
    const body = {
      fileType: 5, //type 5 = RPK or APK
      files: [
        {
          fileName: fileName,
          fileDestUrl: apkServerPath,
        },
      ],
    };

    request.put(
      {
        url: `${base_api}/publish/v2/app-file-info?appId=${appId}`,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
          client_id: this.clientId,
        },
        json: body,
      },
      function (err, httpResponse, body) {
        if (err || !body || httpResponse.statusCode !== 200) {
          reject(err);
        }

        const {ret} = JSON.parse(body);

        if (!ret) reject(new Error('No app-file-info ret'));

        resolve(ret);
      },
    );
  });
};

Huawei.prototype.submitForReviewAsync = appId => {
  return new Promise(async (resolve, reject) => {
    request.post(
      {
        url: `${base_api}/publish/v2/app-submit?appId=${appId}`,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${this.accessToken}`,
          client_id: this.clientId,
        },
      },
      function (err, httpResponse, body) {
        if (err || !body || httpResponse.statusCode !== 200) {
          reject(err);
        }

        const resultCode = JSON.parse(body)?.ret?.code;

        if (resultCode == undefined) reject(new Error('No Result Code'));

        resolve(resultCode);
      },
    );
  });
};

Huawei.prototype.releaseAsync = (filePath, options, onPrpgress) => {
  return new Promise(async (resolve, reject) => {
    try {
      const {appId, releaseNotes} = options;
      const fileName = filePath.replace(/^.*[\\\/]/, '');

      for (const releaseNote of releaseNotes) {
        await this.updateReleaseNotesAsync(
          appId,
          releaseNote.lang,
          releaseNote.note,
        );
      }

      const {authCode, uploadUrl} = await this.getUploadUrlAsync(appId);

      const serverApkUrl = await this.uploadApkToApiAsync(
        authCode,
        uploadUrl,
        filePath,
        onPrpgress,
      );

      await this.updateAppFileInfoAsync(appId, fileName, serverApkUrl);

      this._tryToSubmitCount = 0;
      while (this._tryToSubmitCount < 5) {
        await wait(3000);
        const {resultCode} = await submitForReviewAsync(appId);
        if (resultCode == 0) break;
        else {
          this._tryToSubmitCount++;
          continue;
        }
      }

      resolve();
    } catch (error) {
      reject(error);
    }
  });
};

module.exports = Huawei;
