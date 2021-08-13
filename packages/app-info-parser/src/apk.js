"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

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

var Zip = require('./zip');

var _require = require('./utils'),
    mapInfoResource = _require.mapInfoResource,
    findApkIconPath = _require.findApkIconPath,
    getBase64FromBuffer = _require.getBase64FromBuffer;

var ManifestName = /^androidmanifest\.xml$/;
var ResourceName = /^resources\.arsc$/;

var ManifestXmlParser = require('./xml-parser/manifest');

var ResourceFinder = require('./resource-finder');

var BinaryXmlParser = require('./xml-parser/binary');

var ApkParser = /*#__PURE__*/function (_Zip) {
  _inherits(ApkParser, _Zip);

  var _super = _createSuper(ApkParser);

  /**
   * parser for parsing .apk file
   * @param {String | File | Blob} file // file's path in Node, instance of File or Blob in Browser
   */
  function ApkParser(file, isBrowser) {
    var _this;

    _classCallCheck(this, ApkParser);

    _this = _super.call(this, file, isBrowser);

    if (!(_assertThisInitialized(_this) instanceof ApkParser)) {
      return _possibleConstructorReturn(_this, new ApkParser(file));
    }

    return _this;
  }

  _createClass(ApkParser, [{
    key: "parse",
    value: function parse() {
      var _this3 = this;

      return new Promise(function (resolve, reject) {
        _this3.getEntries([ManifestName, ResourceName]).then(function (buffers) {
          if (!buffers[ManifestName]) {
            throw new Error("AndroidManifest.xml can't be found.");
          }

          var apkInfo = _this3._parseManifest(buffers[ManifestName]);

          var resourceMap;

          if (!buffers[ResourceName]) {
            resolve(apkInfo);
          } else {
            // parse resourceMap
            resourceMap = _this3._parseResourceMap(buffers[ResourceName]); // update apkInfo with resourceMap

            apkInfo = mapInfoResource(apkInfo, resourceMap); // find icon path and parse icon

            var iconPath = findApkIconPath(apkInfo);

            if (iconPath) {
              _this3.getEntry(iconPath).then(function (iconBuffer) {
                apkInfo.icon = iconBuffer ? getBase64FromBuffer(iconBuffer) : null; // is it png?

                if ((apkInfo.icon.toString() || '').includes(';base64,iVBORw0K')) {
                  // yes it is png
                  resolve(apkInfo);
                } else {
                  // no it is not png but maybe xml
                  var xml = new BinaryXmlParser(iconBuffer).parse();

                  if (xml.nodeName == 'bitmap') {
                    // xml.attributes[0].typedValue.value = 'resourceId:0x7f0d0002'
                    var iconRef = xml.attributes[0].typedValue.value.split(':')[1].toUpperCase().replace('0X', '@');

                    _this2.getEntry(resourceMap[iconRef][0]).then(function (iconBuffer) {
                      apkInfo.icon = getBase64FromBuffer(iconBuffer);
                      resolve(apkInfo);
                    });
                  } else if (xml.nodeName == 'adaptive-icon') {
                    //todo
                    resolve(apkInfo);
                  } else {
                    // exception... but when? i dont know.
                    resolve(apkInfo);
                  }
                }
              })["catch"](function (e) {
                alert(e);
                apkInfo.icon = null;
                resolve(apkInfo);
                console.warn('[Warning] failed to parse icon: ', e);
              });
            } else {
              apkInfo.icon = null;
              resolve(apkInfo);
            }
          }
        })["catch"](function (e) {
          alert(e);
          reject(e);
        });
      });
    }
    /**
     * Parse manifest
     * @param {Buffer} buffer // manifest file's buffer
     */

  }, {
    key: "_parseManifest",
    value: function _parseManifest(buffer) {
      try {
        var parser = new ManifestXmlParser(buffer, {
          ignore: ['application.activity', 'application.service', 'application.receiver', 'application.provider', 'permission-group']
        });
        return parser.parse();
      } catch (e) {
        throw new Error('Parse AndroidManifest.xml error: ', e);
      }
    }
    /**
     * Parse resourceMap
     * @param {Buffer} buffer // resourceMap file's buffer
     */

  }, {
    key: "_parseResourceMap",
    value: function _parseResourceMap(buffer) {
      try {
        return new ResourceFinder().processResourceTable(buffer);
      } catch (e) {
        throw new Error('Parser resources.arsc error: ' + e);
      }
    }
  }]);

  return ApkParser;
}(Zip);

module.exports = ApkParser;