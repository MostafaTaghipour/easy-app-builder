const fs = require('fs');
const path = require('path');
const unzipper = require('unzipper');
const zip = new require('node-zip')();

async function wait(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

const removedir = function (path, callback) {
  fs.readdir(path, function (err, files) {
    if (err) {
      // Pass the error on to callback
      callback(err, []);
      return;
    }
    var wait = files.length,
      count = 0,
      folderDone = function (err) {
        count++;
        // If we cleaned out all the files, continue
        if (count >= wait || err) {
          fs.rmdir(path, callback);
        }
      };
    // Empty directory to bail early
    if (!wait) {
      folderDone();
      return;
    }

    // Remove one or more trailing slash to keep from doubling up
    path = path.replace(/\/+$/, '');
    files.forEach(function (file) {
      var curPath = path + '/' + file;
      fs.lstat(curPath, function (err, stats) {
        if (err) {
          callback(err, []);
          return;
        }
        if (stats.isDirectory()) {
          removedir(curPath, folderDone);
        } else {
          fs.unlink(curPath, folderDone);
        }
      });
    });
  });
};

async function removeDirAsync(path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, exist => {
      if (exist)
        removedir(path, error => {
          if (error) reject(error);
          else resolve();
        });
      else resolve();
    });
  });
}
async function removeFileAsync(path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, exist => {
      if (exist)
        fs.unlink(path, error => {
          if (error) {
            if (error) reject(error);
          }
          resolve();
        });
      else resolve();
    });
  });
}

async function unzipFile(path, outputPath) {
  return fs.createReadStream(path).pipe(unzipper.Extract({path: outputPath}));
}

async function isExistsAsync(path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, exists => {
      resolve(exists);
    });
  });
}

async function makeDirIfNotExistAsync(path) {
  return new Promise((resolve, reject) => {
    fs.exists(path, exist => {
      if (!exist) {
        fs.mkdir(path, {recursive: true}, err => {
          if (err) reject(err);
          else resolve();
        });
      } else resolve();
    });
  });
}

async function zipFileAsync(filePath) {
  return new Promise((resolve, reject) => {
    fs.exists(filePath, exist => {
      if (exist) {
        const fileInfo = path.parse(filePath);
        const out = `${fileInfo.dir}/${fileInfo.name}.zip`;

        zip.file(fileInfo.base, fs.readFileSync(filePath));
        var data = zip.generate({base64: false, compression: 'DEFLATE'});

        fs.writeFile(out, data, 'binary', err => {
          if (err) reject(err);
          else resolve(out);
        });
        
      } else reject(new Error(`${filePath} not exist`));
    });
  });
}

async function clearDirFilesAsync(dirPath, excludeExtensions = []) {
  return new Promise((resolve, reject) => {
    fs.exists(dirPath, exist => {
      if (exist) {
        fs.readdir(dirPath, (err, files) => {
          if (err) reject(err);

          for (const file of files) {
            const ext = file.split('.').pop();

            if (!excludeExtensions.includes(ext)) {
              const _path = path.join(dirPath, file);
              const stat = fs.lstatSync(_path);
              if (stat.isFile()) fs.unlinkSync(_path);
              else removeDirAsync(_path);
            }
          }

          resolve();
        });
      } else resolve();
    });
  });
}

const getAllFiles = function (dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function (file) {
    if (fs.statSync(dirPath + '/' + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + '/' + file, arrayOfFiles);
    } else {
      arrayOfFiles.push(path.join(dirPath, '/', file));
    }
  });

  return arrayOfFiles;
};

async function moveFileAsync(oldPath, newPath) {
  return new Promise((resolve, reject) => {
    function copy() {
      var readStream = fs.createReadStream(oldPath);
      var writeStream = fs.createWriteStream(newPath);

      readStream.on('error', reject);
      writeStream.on('error', reject);

      readStream.on('close', function () {
        fs.unlink(oldPath, callback);
      });

      readStream.pipe(writeStream);
    }

    const exists = fs.existsSync(oldPath);

    if (!exists) reject(new Error(`${oldPath} not exist.`));

    fs.rename(oldPath, newPath, function (err) {
      if (err) {
        if (err.code === 'EXDEV') {
          copy();
        } else {
          reject(err);
        }
        return;
      }
      resolve();
    });
  });
}

function getParameterByName(url, name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(url);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

function copyToClipboard(document, text) {
  if (window.clipboardData && window.clipboardData.setData) {
    // Internet Explorer-specific code path to prevent textarea being shown while dialog is visible.
    return window.clipboardData.setData('Text', text);
  } else if (
    document.queryCommandSupported &&
    document.queryCommandSupported('copy')
  ) {
    var textarea = document.createElement('textarea');
    textarea.textContent = text;
    textarea.style.position = 'fixed'; // Prevent scrolling to bottom of page in Microsoft Edge.
    document.body.appendChild(textarea);
    textarea.select();
    try {
      return document.execCommand('copy'); // Security exception may be thrown by some browsers.
    } catch (ex) {
      console.warn('Copy to clipboard failed.', ex);
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}

function replaceAll(str, match, replacement) {
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  }

  return str.replace(new RegExp(escapeRegExp(match), 'g'), () => replacement);
}

module.exports = {
  wait,
  removeDirAsync,
  makeDirIfNotExistAsync,
  getAllFiles,
  moveFileAsync,
  isExistsAsync,
  clearDirFilesAsync,
  unzipFile,
  getParameterByName,
  copyToClipboard,
  removeFileAsync,
  replaceAll,
  zipFileAsync,
};
