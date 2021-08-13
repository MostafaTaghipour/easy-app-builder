const fs = require("fs");
const os = require("os");
const constants = require("../constants");
const { replaceAll } = require("./utils");

const homeDir = os.homedir();

const pathToRoot = process
  .cwd()
  .replace("/easy-app-builder", "")
  .replace("/node_modules", ""); // "/Users/mostafataghipour/Projects/digikala-seller-app"; 

const pathToPackage = `${pathToRoot}/package.json`;
const packageInfo = JSON.parse(fs.readFileSync(pathToPackage, "utf8"));

const pathToIosWorkspace = `${pathToRoot}/ios/${packageInfo.name}`;
const pathToIosProject = `${pathToRoot}/ios/${packageInfo.name}.xcodeproj`;
const pathToPlist = `${pathToIosWorkspace}/Info.plist`;
const pathsToPlists = Array.isArray(pathToPlist) ? pathToPlist : [pathToPlist];

const pathToGradle = `${pathToRoot}/android/app/build.gradle`;
const pathToAndroidMain = `${pathToRoot}/android/app/src/main`;
const pathToAndroidStrings = `${pathToAndroidMain}/res/values/strings.xml`;
const pathToAndroidManifest = `${pathToAndroidMain}/AndroidManifest.xml`;

let outputRootPath = "";
let outputPath = "";
let outputNamePattern = "";

let iosBuildNumber = undefined;
let iosVersionName = undefined;
let iosAppName = undefined;
let iosBundleIdentifier = undefined;
let iosAppleTeamId = undefined;
let androidVersionCode = undefined;
let androidVersionName = undefined;
let androidAppName = undefined;
let androidPackage = undefined;

module.exports = {
  getHomeDir() {
    return homeDir;
  },
  getPathToRoot() {
    return pathToRoot;
  },
  getPackageInfo() {
    return packageInfo;
  },
  getProjectName() {
    return this.getPackageInfo().name;
  },
  getIosBuildNumber: function () {
    if (iosBuildNumber !== undefined) return iosBuildNumber;

    const content = fs.readFileSync(pathsToPlists[0], "utf8");
    const match = content.match(
      /(<key>CFBundleVersion<\/key>\s+<string>)([\d\.]+)(<\/string>)/
    );
    if (match && match[2]) {
      iosBuildNumber = parseInt(match[2]);
    } else {
      iosBuildNumber = 1;
    }

    return iosBuildNumber;
  },
  getIosVersionName: function () {
    if (iosVersionName !== undefined) return iosVersionName;

    const content = fs.readFileSync(pathsToPlists[0], "utf8");
    const match = content.match(
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)([\d\.]+)(<\/string>)/
    );
    if (match && match[2]) {
      iosVersionName = match[2];
    } else {
      iosVersionName = "1.0";
    }

    return iosVersionName;
  },
  getIosAppName: function () {
    if (iosAppName !== undefined) return iosAppName;
    const content = fs.readFileSync(
      `${pathToIosProject}/project.pbxproj`,
      "utf8"
    );
    const match = content.match(/PRODUCT_NAME = (.*);/g);
    if (match && match[2]) {
      iosAppName = match[2]
        .replace(";", "")
        .replace(/"/g, "")
        .replace("PRODUCT_NAME = ", "");
    } else iosAppName = "";

    return iosAppName;
  },
  getIosBundleIdentifier: function () {
    if (iosBundleIdentifier !== undefined) return iosBundleIdentifier;
    const content = fs.readFileSync(
      `${pathToIosProject}/project.pbxproj`,
      "utf8"
    );
    const match = content.match(/PRODUCT_BUNDLE_IDENTIFIER = (.*);/g);
    if (match && match[2]) {
      iosBundleIdentifier = match[2]
        .replace(";", "")
        .replace(/"/g, "")
        .replace("PRODUCT_BUNDLE_IDENTIFIER = ", "")
        .replace("$(BUNDLE_ID_SUFFIX)", "");
    } else iosBundleIdentifier = "";

    return iosBundleIdentifier;
  },
  getIosAppleTeamId: function () {
    if (iosAppleTeamId !== undefined) return iosAppleTeamId;
    const content = fs.readFileSync(
      `${pathToIosProject}/project.pbxproj`,
      "utf8"
    );
    const match = content.match(/DEVELOPMENT_TEAM = (.*);/g);
    if (match && match[1]) {
      iosAppleTeamId = match[1]
        .replace(";", "")
        .replace(/"/g, "")
        .replace("DEVELOPMENT_TEAM = ", "");
    } else iosAppleTeamId = "";

    return iosAppleTeamId;
  },
  getAndroidVersionCode: function () {
    if (androidVersionCode !== undefined) return androidVersionCode;

    let content = fs.readFileSync(pathToGradle, "utf8");
    const match = content.match(/(\s*versionCode\s+["']?)(\d+)(["']?\s*)/);
    if (match && match[0]) {
      androidVersionCode = parseInt(
        match[0].replace(/\s+/g, "").replace("versionCode", "")
      );
    } else androidVersionCode = 1;

    return androidVersionCode;
  },
  getAndroidVersionName: function () {
    if (androidVersionName !== undefined) return androidVersionName;

    let content = fs.readFileSync(pathToGradle, "utf8");
    const match = content.match(/(\s*versionName\s+["']?)([\d\.]+)(["']?\s*)/);
    if (match && match[0]) {
      androidVersionName = match[0]
        .replace(/\s+/g, "")
        .replace(/['"]+/g, "")
        .replace("versionName", "");
    } else androidVersionName = "1.0";

    return androidVersionName;
  },

  getAndroidAppName: function () {
    if (androidAppName !== undefined) return androidAppName;

    let content = fs.readFileSync(pathToAndroidStrings, "utf8");
    const match = content.match(/<string name="([^"]+)">([^<]+)<\/string>/i);
    if (match && match[2]) {
      androidAppName = match[2];
    } else androidAppName = "";

    return androidAppName;
  },

  getAndroidPackage: function () {
    if (androidPackage !== undefined) return androidPackage;

    let content = fs.readFileSync(pathToAndroidManifest, "utf8");
    const match = content.match(/package="(.*?)"/i);
    if (match && match[1]) {
      androidPackage = match[1];
    } else androidPackage = "";

    return androidPackage;
  },

  replacePlaceHolders(text, platform, variant) {
    const _platform = platform || "Android",
      _variant = variant || "",
      _ext = _platform.toLowerCase() == "ios" ? "ipa" : "apk",
      _version =
        _platform.toLowerCase() == "ios"
          ? this.getIosVersionName()
          : this.getAndroidVersionName(),
      _appName = (
        _platform.toLowerCase() == "ios"
          ? this.getIosAppName()
          : this.getAndroidAppName()
      ).replace(/\s/g, ""),
      _build =
        _platform.toLowerCase() == "ios"
          ? this.getIosBuildNumber()
          : this.getAndroidVersionCode();

    let res = replaceAll(text, constants.OUTPUT_NAME_KEY, outputNamePattern);
    res = replaceAll(res, constants.USER_ROOT_DIR_KEY, this.getHomeDir());
    res = replaceAll(res, constants.PROJECT_ROOT_DIR_KEY, this.getPathToRoot());
    res = replaceAll(res, constants.PROJECT_NAME_KEY, this.getProjectName());
    res = replaceAll(res, constants.OUTPUT_PATH_KEY, this.getOutputPath());
    res = replaceAll(res, constants.VERSION_NAME_KEY, _version);
    res = replaceAll(res, constants.BUILD_NAMBER_KEY, _build);
    res = replaceAll(res, constants.APP_NAME_KEY, _appName);
    res = replaceAll(res, constants.APP_EXTENSION, _ext);
    res = replaceAll(res, constants.APP_PLATFORM, _platform);
    res = replaceAll(res, constants.APP_VARIANT, _variant);

    return res;
  },

  setOutputRootPath(path) {
    outputRootPath = this.replacePlaceHolders(path);
  },
  getOutputRootPath() {
    return outputRootPath;
  },
  getOutputPath(platform) {
    return `${this.getOutputRootPath()}/${this.getProjectName()}`;
  },
  setAppOutputNamePattern(pattern) {
    outputNamePattern = pattern;
  },
  getAppOutputName(platform, variant) {
    return this.replacePlaceHolders(outputNamePattern, platform, variant);
  },
  getAndroidDefaultBuildScripts(variant = "") {
    return [
      "rm -rf {{projRootDir}}/android/app/build/outputs/apk",
      `cd {{projRootDir}}/android && ./gradlew app:assemble${variant}Release`,
      "sleep 30 && mv {{projRootDir}}/android/app/build/outputs/apk/**/**/*.apk {{outputPath}}/{{outputName}}",
    ];
  },

  getIosDefaultBuildScripts(variant = "") {
    return [
      "cd {{projRootDir}}/ios && rm -rf output && mkdir -p output",
      "node ./js/tasks/generateExport {{projRootDir}}/ios/output/ExportOptions.plist ad-hoc",
      `cd {{projRootDir}}/ios && xcodebuild archive -allowProvisioningUpdates -workspace {{projName}}.xcworkspace -scheme {{projName}}${variant} -configuration ${variant}Release -archivePath {{projRootDir}}/ios/output/{{projName}}.xcarchive`,
      "cd {{projRootDir}}/ios && xcodebuild -exportArchive -allowProvisioningUpdates -archivePath {{projRootDir}}/ios/output/{{projName}}.xcarchive -exportPath {{projRootDir}}/ios/output/ -exportOptionsPlist {{projRootDir}}/ios/output/ExportOptions.plist",
      "sleep 30 && mv {{projRootDir}}/ios/output/*.ipa {{outputPath}}/{{outputName}}",
      "rm -rf {{projRootDir}}/ios/output",
    ];
  },
};
