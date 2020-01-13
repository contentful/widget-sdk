#!/usr/bin/env node

const path = require('path');
const { sync: rimrafSync } = require('rimraf');
const { buildTestDeps } = require('../webpack-tasks');

rimrafSync(path.resolve(__dirname, '..', '..', 'public'));
rimrafSync(path.resolve(__dirname, '..', '..', 'build'));
buildTestDeps();
