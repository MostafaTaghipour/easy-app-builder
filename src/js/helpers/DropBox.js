const fs = require('fs');
const path = require('path');
const {google} = require('googleapis');
var mime = require('mime-types');
const {resolve} = require('path');
const shell = require('./shell');
const request = require('request');

const DropBox = function (accessToken) {
  if (!accessToken) throw new Error('accessToken is required');
  this.accessToken = accessToken;
};

/**
 * upload a file to google drive
 * @param {string} filePath
 * @returns  uploaded file info
 */
DropBox.prototype.uploadFileAsync = function (filePath) {
  const fileName = path.parse(filePath).base;
  const content = fs.readFileSync(filePath);

  return new Promise(async (resolve, reject) => {
    request.post(
      `https://content.dropboxapi.com/2/files/upload`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Dropbox-API-Arg': JSON.stringify({
            path: `/${fileName}`,
            mode: 'overwrite',
            autorename: true,
            mute: false,
            strict_conflict: false,
          }),
          'Content-Type': 'application/octet-stream',
        },
        body: content,
      },
      (err, response, body) => {
        if (err || response.statusCode !== 200) reject(err);
        else resolve(JSON.parse(body));
      },
    );
  });
};

DropBox.prototype.shareFileAsync = function (serverFilePath) {
  return new Promise(async (resolve, reject) => {
    const links = await request.post(
      `https://api.dropboxapi.com/2/sharing/list_shared_links`,
      {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
        },
      },
      (err, response, body) => {
        if (err || response.statusCode !== 200) {
          reject(err);
          return;
        }

        const res = JSON.parse(body);
        const link = res?.links?.find(x => x.path_lower == serverFilePath)?.url;

        if (link) {
          resolve(link);
          return;
        }

        request.post(
          `https://api.dropboxapi.com/2/sharing/create_shared_link_with_settings`,
          {
            headers: {
              Authorization: `Bearer ${this.accessToken}`,
              'Content-Type': 'application/json',
            },
            json: {
              path: serverFilePath,
              settings: {
                audience: 'public',
                access: 'viewer',
                requested_visibility: 'public',
                allow_download: true,
              },
            },
          },
          (err, response, body) => {
            if (err || response.statusCode !== 200) {
              reject(err);
              return;
            }
            resolve(body.url);
          },
        );
      },
    );
  });
};

module.exports = DropBox;
