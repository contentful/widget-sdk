#!/usr/bin/env node
const B = require('bluebird');
const U = require('../lib/utils');
const {validate: validateConfig} = require('../lib/config-validator');

B.coroutine(validateFiles)(process.argv.slice(2))
.done();

function* validateFiles (files) {
  for (const file of files) {
    const config = yield U.readJSON(file);
    try {
      validateConfig(config);
    } catch (e) {
      console.error(`Failed to validate ${file}`);
      console.error(e.errors);
      process.exit(1);
    }
  }
}
