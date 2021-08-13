"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var Unzip = require("isomorphic-unzip");

var _require = require("./utils"),
    isBrowser = _require.isBrowser,
    decodeNullUnicode = _require.decodeNullUnicode;

var Zip = /*#__PURE__*/function () {
  function Zip(file, isBrows) {
    _classCallCheck(this, Zip);

    this.isBrowser = isBrows != undefined ? isBrows : isBrowser();

    if (this.isBrowser) {
      if (!(file instanceof window.Blob || typeof file.size !== "undefined")) {
        throw new Error("Param error: [file] must be an instance of Blob or File in browser.");
      }

      this.file = file;
    } else {
      if (typeof file !== "string") {
        throw new Error("Param error: [file] must be file path in Node.");
      }

      this.file = require("path").resolve(file);
    }

    this.unzip = new Unzip(this.file);
  }
  /**
   * get entries by regexps, the return format is: { <filename>: <Buffer|Blob> }
   * @param {Array} regexps // regexps for matching files
   * @param {String} type // return type, can be buffer or blob, default buffer
   */


  _createClass(Zip, [{
    key: "getEntries",
    value: function getEntries(regexps) {
      var _this = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "buffer";
      regexps = regexps.map(function (regex) {
        return decodeNullUnicode(regex);
      });
      return new Promise(function (resolve, reject) {
        _this.unzip.getBuffer(regexps, {
          type: type
        }, function (err, buffers) {
          err ? reject(err) : resolve(buffers);
        });
      });
    }
    /**
     * get entry by regex, return an instance of Buffer or Blob
     * @param {Regex} regex // regex for matching file
     * @param {String} type // return type, can be buffer or blob, default buffer
     */

  }, {
    key: "getEntry",
    value: function getEntry(regex) {
      var _this2 = this;

      var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : "buffer";
      regex = decodeNullUnicode(regex);
      return new Promise(function (resolve, reject) {
        _this2.unzip.getBuffer([regex], {
          type: type
        }, function (err, buffers) {
          err ? reject(err) : resolve(buffers[regex]);
        });
      });
    }
  }]);

  return Zip;
}();

module.exports = Zip;