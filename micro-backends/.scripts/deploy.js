'use strict';

const path = require('path');

const MicroBackends = require('@contentful/micro-backends');

const backendsDir = path.resolve(__dirname, '..');
const alias = process.argv[2];

console.log(`Deploying micro-backend from "${backendsDir}" with alias "${alias}"...`);

MicroBackends.deployAll({ backendsDir, alias }).then(
  ok => console.log(ok),
  err => {
    console.error(err);
    process.exit(1);
  }
);
