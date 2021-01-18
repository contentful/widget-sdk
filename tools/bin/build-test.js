#!/usr/bin/env node

const path = require('path');
const { sync: rimrafSync } = require('rimraf');

rimrafSync(path.resolve(__dirname, '..', '..', 'public'));
rimrafSync(path.resolve(__dirname, '..', '..', 'build'));
