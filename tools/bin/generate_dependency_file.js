#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const _ = require('lodash');

const { createBabelOptions } = require('../app-babel-options');
const createWebpackConfig = require('../webpack.config');
const rootPath = path.resolve(__dirname, '..', '..');
const srcPath = path.resolve(rootPath, 'src', 'javascripts');
const depNames = recursiveRead(srcPath);

function generate() {
  const testDepNames = [
    'angular-mocks',
    'enzyme',
    'enzyme-adapter-react-16',
    'react-dom/test-utils',
    'sinon'
  ];

  const stringifiedDeps = `
window.jQuery = window.$ = require('jquery');

window.libs = [
${depNames
  .concat(testDepNames)
  .map(depName => {
    return `  ['${depName}', require('${depName}')]`;
  })
  .join(',\n')}
];
`;

  ensureBuildDirExists();

  const depsFilePath = path.resolve(rootPath, 'build', 'dependencies-pre.js');

  fs.writeFileSync(depsFilePath, stringifiedDeps);
}

/*
  Recursively read through directory `p`, and determine
  dependencies for each .js file.
  Returns object with filename as key and dependency info as value.
 */
function recursiveRead(p) {
  const deps = [];

  fs.readdirSync(p).forEach(name => {
    const resolved = path.resolve(p, name);
    const isJsFile = resolved.endsWith('.js');
    const isSpecFile = isJsFile && resolved.endsWith('.spec.js');
    const isMocksDir = resolved.endsWith('__mocks__');
    const isTestsDir = resolved.endsWith('__test__');

    // Ignore .spec.js files
    if (isSpecFile || isMocksDir || isTestsDir) {
      return;
    }

    const stats = fs.statSync(resolved);

    if (stats.isFile() && isJsFile) {
      const fileDeps = determineDependencies(resolved);

      deps.push(fileDeps);
    } else if (stats.isDirectory()) {
      const dirDeps = recursiveRead(resolved);

      deps.push(dirDeps);
    }
  });

  return _.uniq(_.flatten(deps));
}

function determineDependencies(p) {
  const raw = fs.readFileSync(p).toString();
  const babelOptions = createBabelOptions();

  let ast;

  try {
    ast = babel.parseSync(raw, babelOptions);
  } catch (e) {
    console.log(`Could not parse ${p}`);
    console.log(e);

    return;
  }

  const imports = [];

  babel.traverse(ast, {
    enter: ({ node, parent }) => {
      let value;

      if (node.type === 'ImportDeclaration') {
        value = node.source.value;
      } else if (node.type === 'Import') {
        if (parent.arguments.length !== 1) {
          return;
        }

        value = parent.arguments[0].value;
      }

      if (isExternalImport(value)) {
        imports.push(value);
      }
    }
  });

  return imports;
}

function isExternalImport(importName) {
  try {
    require.resolve(importName);

    return true;
  } catch (e) {
    // pass
  }

  // If it wasn't resolved via `require`, then we also check if it is aliased in Webpack
  const conf = createWebpackConfig();

  if (conf.resolve && conf.resolve.alias[importName]) {
    return true;
  }

  return false;
}

function ensureBuildDirExists() {
  fs.mkdirSync(path.resolve(rootPath, 'build'),  { recursive: true });
}

module.exports = generate;

if (require.main === module) {
  generate();
}
