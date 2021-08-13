"use strict";

function objectType(o) {
  return Object.prototype.toString.call(o).slice(8, -1).toLowerCase();
}

function isArray(o) {
  return objectType(o) === 'array';
}

function isObject(o) {
  return objectType(o) === 'object';
}

function isPrimitive(o) {
  return o === null || ['boolean', 'number', 'string', 'undefined'].includes(objectType(o));
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}
/**
 * map file place with resourceMap
 * @param {Object} apkInfo // json info parsed from .apk file
 * @param {Object} resourceMap // resourceMap
 */


function mapInfoResource(apkInfo, resourceMap) {
  iteratorObj(apkInfo);
  return apkInfo;

  function iteratorObj(obj) {
    for (var i in obj) {
      if (isArray(obj[i])) {
        iteratorArray(obj[i]);
      } else if (isObject(obj[i])) {
        iteratorObj(obj[i]);
      } else if (isPrimitive(obj[i])) {
        if (isResources(obj[i])) {
          obj[i] = resourceMap[transKeyToMatchResourceMap(obj[i])];
        }
      }
    }
  }

  function iteratorArray(array) {
    var l = array.length;

    for (var i = 0; i < l; i++) {
      if (isArray(array[i])) {
        iteratorArray(array[i]);
      } else if (isObject(array[i])) {
        iteratorObj(array[i]);
      } else if (isPrimitive(array[i])) {
        if (isResources(array[i])) {
          array[i] = resourceMap[transKeyToMatchResourceMap(array[i])];
        }
      }
    }
  }

  function isResources(attrValue) {
    if (!attrValue) return false;

    if (typeof attrValue !== 'string') {
      attrValue = attrValue.toString();
    }

    return attrValue.indexOf('resourceId:') === 0;
  }

  function transKeyToMatchResourceMap(resourceId) {
    return '@' + resourceId.replace('resourceId:0x', '').toUpperCase();
  }
}
/**
 * find .apk file's icon path from json info
 * @param info // json info parsed from .apk file
 */


function findApkIconPath(info) {
  if (!info.application.icon || !info.application.icon.splice) {
    return '';
  }

  var rulesMap = {
    mdpi: 48,
    hdpi: 72,
    xhdpi: 96,
    xxdpi: 144,
    xxxhdpi: 192
  };
  var resultMap = {};
  var maxDpiIcon = {
    dpi: 120,
    icon: ''
  };

  var _loop = function _loop(i) {
    info.application.icon.some(function (icon) {
      if (icon && icon.indexOf(i) !== -1) {
        resultMap['application-icon-' + rulesMap[i]] = icon;
        return true;
      }
    }); // get the maximal size icon

    if (resultMap['application-icon-' + rulesMap[i]] && rulesMap[i] >= maxDpiIcon.dpi) {
      maxDpiIcon.dpi = rulesMap[i];
      maxDpiIcon.icon = resultMap['application-icon-' + rulesMap[i]];
    }
  };

  for (var i in rulesMap) {
    _loop(i);
  } // alert(JSON.stringify(maxDpiIcon));


  if (Object.keys(resultMap).length === 0 || !maxDpiIcon.icon) {
    var pngRoundIcons = info.application.roundIcon.filter(function (x) {
      return !x.endsWith('.xml');
    });
    var pngIcons = info.application.icon.filter(function (x) {
      return !x.endsWith('.xml');
    });
    maxDpiIcon.dpi = 120;
    maxDpiIcon.icon = pngRoundIcons.length > 1 ? pngRoundIcons[pngRoundIcons.length - 1] : pngIcons.length > 1 ? pngIcons[pngIcons.length - 1] : info.application.icon[0] || '';
    resultMap['applicataion-icon-120'] = maxDpiIcon.icon;
  }

  return maxDpiIcon.icon;
}
/**
 * find .ipa file's icon path from json info
 * @param info // json info parsed from .ipa file
 */


function findIpaIconPath(info) {
  if (info.CFBundleIcons && info.CFBundleIcons.CFBundlePrimaryIcon && info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles && info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles.length) {
    return info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles[info.CFBundleIcons.CFBundlePrimaryIcon.CFBundleIconFiles.length - 1];
  } else if (info.CFBundleIconFiles && info.CFBundleIconFiles.length) {
    return info.CFBundleIconFiles[info.CFBundleIconFiles.length - 1];
  } else {
    return '.app/Icon.png';
  }
}
/**
 * transform buffer to base64
 * @param {Buffer} buffer
 */


function getBase64FromBuffer(buffer) {
  return 'data:image/png;base64,' + buffer.toString('base64');
}
/**
 * 去除unicode空字符
 * @param {String} str
 */


function decodeNullUnicode(str) {
  if (typeof str === 'string') {
    // eslint-disable-next-line
    str = str.replace(/\u0000/g, '');
  }

  return str;
}

module.exports = {
  isArray: isArray,
  isObject: isObject,
  isPrimitive: isPrimitive,
  isBrowser: isBrowser,
  mapInfoResource: mapInfoResource,
  findApkIconPath: findApkIconPath,
  findIpaIconPath: findIpaIconPath,
  getBase64FromBuffer: getBase64FromBuffer,
  decodeNullUnicode: decodeNullUnicode
};