"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var ApkParser = require('./apk');

var IpaParser = require('./ipa');

var supportFileTypes = ['ipa', 'apk'];

var AppInfoParser = /*#__PURE__*/function () {
  /**
   * parser for parsing .ipa or .apk file
   * @param {String | File | Blob} file // file's path in Node, instance of File or Blob in Browser
   */
  function AppInfoParser(file, isBrowser) {
    _classCallCheck(this, AppInfoParser);

    if (!file) {
      throw new Error("Param miss: file(file's path in Node, instance of File or Blob in browser).");
    }

    var splits = (file.name || file).split('.');
    var fileType = splits[splits.length - 1].toLowerCase();

    if (!supportFileTypes.includes(fileType)) {
      throw new Error('Unsupported file type, only support .ipa or .apk file.');
    }

    this.file = file;

    switch (fileType) {
      case 'ipa':
        this.parser = new IpaParser(this.file, isBrowser);
        break;

      case 'apk':
        this.parser = new ApkParser(this.file, isBrowser);
        break;
    }
  }

  _createClass(AppInfoParser, [{
    key: "parse",
    value: function parse() {
      return this.parser.parse();
    }
  }]);

  return AppInfoParser;
}();

module.exports = AppInfoParser;