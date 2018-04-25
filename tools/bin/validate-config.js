#!/usr/bin/env node
const U = require('../lib/utils');
const {validate: validateConfig} = require('../lib/config-validator');

validateFiles(process.argv.slice(2))
.catch(e => {
  // from bluebird `.done()` – https://github.com/petkaantonov/bluebird/blob/master/src/async.js#L49-L53
  process.stderr.write('Fatal ' + (e instanceof Error ? e.stack : e) + '\n');
  process.exit(1);
});

async function validateFiles (files) {
  for (const file of files) {
    const config = await U.readJSON(file);
    try {
      validateConfig(config);
    } catch (e) {
      console.error(`Failed to validate ${file}`);
      console.error(e.errors);
      process.exit(1);
    }
  }
}
