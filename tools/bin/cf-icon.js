#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const _ = require('lodash');

/*
  Process ui/Components/Icon.es6, and look at all the imports that have a value that starts with svg/
  Find all SVGs in the svg folder
  Take the difference between these two lists
 */

const svgDirname = path.resolve(__dirname, '..', '..', 'src', 'javascripts', 'svg');

const missing = [];

fs.readdirSync(svgDirname).forEach(file => {
  const filename = `svg/${file.split('.js')[0]}`;

  missing.push(filename);
});

console.log(missing.map(topLevelImportString).join('\n'));
console.log('\n\n\n\n--------\n\n\n\n');
console.log(`const SVGs = {
  ${missing.map(svgMap).join(',\n')}
};`);

function topLevelImportString(filename) {
  const dependencyName = genDepName(filename);

  return `import ${dependencyName} from '${filename}';`;
}

function svgMap(filename) {
  const dependencyName = genDepName(filename);
  const key = filename.split('.es6')[0].split('svg/')[1];

  return `'${key}': ${dependencyName}`;
}

function genDepName(filename) {
  return _.camelCase(filename);
}
