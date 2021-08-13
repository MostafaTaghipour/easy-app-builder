"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function"); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, writable: true, configurable: true } }); if (superClass) _setPrototypeOf(subClass, superClass); }

function _setPrototypeOf(o, p) { _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) { o.__proto__ = p; return o; }; return _setPrototypeOf(o, p); }

function _createSuper(Derived) { var hasNativeReflectConstruct = _isNativeReflectConstruct(); return function _createSuperInternal() { var Super = _getPrototypeOf(Derived), result; if (hasNativeReflectConstruct) { var NewTarget = _getPrototypeOf(this).constructor; result = Reflect.construct(Super, arguments, NewTarget); } else { result = Super.apply(this, arguments); } return _possibleConstructorReturn(this, result); }; }

function _possibleConstructorReturn(self, call) { if (call && (_typeof(call) === "object" || typeof call === "function")) { return call; } return _assertThisInitialized(self); }

function _assertThisInitialized(self) { if (self === void 0) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return self; }

function _isNativeReflectConstruct() { if (typeof Reflect === "undefined" || !Reflect.construct) return false; if (Reflect.construct.sham) return false; if (typeof Proxy === "function") return true; try { Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {})); return true; } catch (e) { return false; } }

function _getPrototypeOf(o) { _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) { return o.__proto__ || Object.getPrototypeOf(o); }; return _getPrototypeOf(o); }

var parsePlist = require("plist").parse;

var parseBplist = require("bplist-parser").parseBuffer;

var cgbiToPng = require("cgbi-to-png");

var Zip = require("./zip");

var _require = require("./utils"),
    findIpaIconPath = _require.findIpaIconPath,
    getBase64FromBuffer = _require.getBase64FromBuffer;

var PlistName = new RegExp("payload/.+?.app/info.plist$", "i");
var ProvisionName = /payload\/.+?\.app\/embedded.mobileprovision/;

var IpaParser = /*#__PURE__*/function (_Zip) {
  _inherits(IpaParser, _Zip);

  var _super = _createSuper(IpaParser);

  /**
   * parser for parsing .ipa file
   * @param {String | File | Blob} file // file's path in Node, instance of File or Blob in Browser
   */
  function IpaParser(file, isBrowser) {
    var _this;

  
    _classCallCheck(this, IpaParser);

    _this = _super.call(this, file, isBrowser);

    if (!(_assertThisInitialized(_this) instanceof IpaParser)) {
      return _possibleConstructorReturn(_this, new IpaParser(file));
    }

    return _this;
  }

  _createClass(IpaParser, [{
    key: "parse",
    value: function parse() {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        _this2.getEntries([PlistName, ProvisionName]).then(function (buffers) {
          if (!buffers[PlistName]) {
            throw new Error("Info.plist can't be found.");
          }

          var plistInfo = _this2._parsePlist(buffers[PlistName]); // parse mobile provision


          var provisionInfo = _this2._parseProvision(buffers[ProvisionName]);

          plistInfo.mobileProvision = provisionInfo; // find icon path and parse icon

          var iconRegex = new RegExp(findIpaIconPath(plistInfo).toLowerCase());

          _this2.getEntry(iconRegex).then(function (iconBuffer) {
            try {
              // In general, the ipa file's icon has been specially processed, should be converted
              plistInfo.icon = iconBuffer ? getBase64FromBuffer(cgbiToPng.revert(iconBuffer)) : null;
            } catch (err) {
              if (_this2.isBrowser) {
                // Normal conversion in other cases
                plistInfo.icon = iconBuffer ? getBase64FromBuffer(window.btoa(String.fromCharCode.apply(String, _toConsumableArray(iconBuffer)))) : null;
              } else {
                plistInfo.icon = null;
                console.warn("[Warning] failed to parse icon: ", err);
              }
            }

            resolve(plistInfo);
          })["catch"](function (e) {
            reject(e);
          });
        })["catch"](function (e) {
          reject(e);
        });
      });
    }
    /**
     * Parse plist
     * @param {Buffer} buffer // plist file's buffer
     */

  }, {
    key: "_parsePlist",
    value: function _parsePlist(buffer) {
      var result;
      var bufferType = buffer[0];

      if (bufferType === 60 || bufferType === "<" || bufferType === 239) {
        result = parsePlist(buffer.toString());
      } else if (bufferType === 98) {
        result = parseBplist(buffer)[0];
      } else {
        throw new Error("Unknown plist buffer type.");
      }

      return result;
    }
    /**
     * parse provision
     * @param {Buffer} buffer // provision file's buffer
     */

  }, {
    key: "_parseProvision",
    value: function _parseProvision(buffer) {
      var info = {};

      if (buffer) {
        var content = buffer.toString("utf-8");
        var firstIndex = content.indexOf("<?xml");
        var endIndex = content.indexOf("</plist>");
        content = content.slice(firstIndex, endIndex + 8);

        if (content) {
          info = parsePlist(content);
        }
      }

      return info;
    }
  }]);

  return IpaParser;
}(Zip);

module.exports = IpaParser;