const helpers = require('../helpers');
const {exportOptionsPlist} = require('../helpers/export');

const path = helpers.replacePlaceHolders(process.argv[2]);
const method = process.argv[3];
const overTheAir = process.argv[4]?.includes('ota');

try {
  exportOptionsPlist(path, method, overTheAir);
} catch (error) {}
