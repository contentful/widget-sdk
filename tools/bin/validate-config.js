#!/usr/bin/env babel-node

import * as B from 'bluebird';
import * as U from '../lib/utils';
import {validate as validateConfig} from '../lib/config-validator';

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
