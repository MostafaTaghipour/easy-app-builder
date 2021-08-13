const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
var mime = require('mime-types');
const {resolve} = require('path');
const shell = require('./shell');

// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const GoogleDrive = function (keyFilePath) {
  if (!keyFilePath) throw new Error('keyfile is required');
  this.keys = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
  this.drive = google.drive('v3');

  this.jwToken = new google.auth.JWT(
    this.keys.client_email,
    null,
    this.keys.private_key,
    SCOPES,
    null,
  );

  this.jwToken.authorize(authErr => {
    if (authErr) {
      throw authErr;
      return;
    } else {
      console.log('Authorization accorded');
    }
  });
};

/**
 * upload a file to google drive
 * @param {string} filePath
 * @returns  uploaded file id
 */
GoogleDrive.prototype.uploadFileAsync = function (filePath) {
  const fileName = path.parse(filePath).base;
  const mimeType = mime.lookup(fileName);

  return new Promise(async (resolve, reject) => {
    try {
      let id;
      await shell.executeCommand(
        `curl -X POST -L \
      -H "Authorization: Bearer ${this.jwToken.credentials.access_token}" \
      -F "metadata={name : '${fileName}'};type=application/json;charset=UTF-8" \
      -F "file=@${filePath};type=${mimeType}" \
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart"`,
        data => {
          id = JSON.parse(data).id;
        },
      );
      resolve(id);
    } catch (error) {
      reject(error);
    }

    // var metadata = {
    //   name: fileName,
    //   mimeType,
    //   // parents: ['root'], // Google Drive folder id
    //   // uploadType: 'multipart',
    // };
    // this.drive.files.create(
    //   {
    //     auth: this.jwToken,
    //     resource: metadata,
    //     media: {
    //       mimeType,
    //       body: fs.createReadStream(filePath),
    //     },
    //     fields: 'id',
    //   },
    //   function (err, res) {
    //     if (err) {
    //       reject(err);
    //     } else {
    //       const {
    //         data: {id},
    //       } = res;
    //       resolve(id);
    //     }
    //   },
    // );
  });
};

GoogleDrive.prototype.createFolderAsync = function (folderName) {
  return new Promise((resolve, reject) => {
    var fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    };
    this.drive.files.create(
      {
        auth: this.jwToken,
        resource: fileMetadata,
        fields: 'id',
      },
      function (err, res) {
        if (err) {
          reject(err);
        } else {
          const {
            data: {id},
          } = res;
          resolve(id);
        }
      },
    );
  });
};

GoogleDrive.prototype.getFileInfoAsync = function (fileId) {
  return new Promise((resolve, reject) => {
    this.drive.files.get(
      {
        auth: this.jwToken,
        fileId: fileId,
        fields: 'webViewLink, webContentLink, name, id',
      },
      function (err, res) {
        if (err) {
          reject(err);
        } else {
          const {data} = res;
          resolve(data);
        }
      },
    );
  });
};

GoogleDrive.prototype.shareFileAsync = function (fileId) {
  return new Promise((resolve, reject) => {
    this.drive.permissions.create(
      {
        auth: this.jwToken,
        fileId: fileId,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
      },
      function (err, res) {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      },
    );
  });
};

module.exports = GoogleDrive;
