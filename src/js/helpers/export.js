const fs = require('fs');
const helpers = require('.');
const config = require('../constants/configs');

async function exportOptionsPlist(path, distributionMethod, overTheAir) {
  const {
    overTheAirManifestUrl,
    overTheAirManifestDisplayImageUrl,
    overTheAirManifestFullImageUrl,
  } = config.getIosExportPrefs();

  const appleTeamId = helpers.getIosAppleTeamId();

  if (!appleTeamId) return;

  let data = '';

  if (distributionMethod == 'app-store') {
    data = await fs.promises.readFile(
      `${process.cwd()}/src/assets/plists/sampleAppStoreExportOptions.plist`,
      'utf8',
    );
  } else {
    data = await fs.promises.readFile(
      `${process.cwd()}/src/assets/plists/sampleExportOptions.plist`,
      'utf8',
    );
  }

  if (
    overTheAir &&
    overTheAirManifestUrl &&
    overTheAirManifestDisplayImageUrl &&
    overTheAirManifestFullImageUrl
  ) {
    data = data.replace(
      '{{MANIFEST}}',
      `<key>manifest</key>
    <dict>
      <key>appURL</key>
      <string>${overTheAirManifestUrl}</string>
      <key>displayImageURL</key>
      <string>${overTheAirManifestDisplayImageUrl}</string>
      <key>fullSizeImageURL</key>
      <string>${overTheAirManifestFullImageUrl}</string>
    </dict>`,
    );
  } else {
    data = data.replace('{{MANIFEST}}', '');
  }

  data = data.replace('{{METHOD}}', distributionMethod);

  data = data.replace('{{APPLE_TEAM_ID}}', appleTeamId);

  try {
    await fs.promises.writeFile(path, data, 'utf8');
  } catch (error) {
    console.log(error);
  }
}

async function iosOverTheAirManifest(bundleId, name, version) {
  const {
    overTheAirManifestUrl,
    overTheAirManifestDisplayImageUrl,
    overTheAirManifestFullImageUrl,
  } = config.getIosExportPrefs();

  if (
    !bundleId ||
    !name ||
    !version ||
    !overTheAirManifestFullImageUrl ||
    !overTheAirManifestUrl ||
    !overTheAirManifestDisplayImageUrl
  )
    return;

  let data = await fs.promises.readFile(
    `${process.cwd()}/src/assets/plists/sampleManifest.plist`,
    'utf8',
  );

  data = data
    .replace('{{MANIFEST_APP_URL}}', overTheAirManifestUrl)
    .replace('{{MANIFEST_DISPLAY_IMAGE}}', overTheAirManifestDisplayImageUrl)
    .replace('{{MANIFEST_FULL_IMAGE}}', overTheAirManifestFullImageUrl)
    .replace('{{BUNDLE_IDENTIFIER}}', bundleId)
    .replace('{{APP_VERSION}}', version)
    .replace('{{APP_TITLE}}', name);

  return data;
}

module.exports = {
  exportOptionsPlist,
  iosOverTheAirManifest,
};
