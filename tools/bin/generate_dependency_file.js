#!/usr/bin/env node

// TODO

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');
const _ = require('lodash');

const { createBabelOptions } = require('../app-babel-options');
const rootPath = path.resolve(__dirname, '..', '..');
const srcPath = path.resolve(rootPath, 'src', 'javascripts');
// const pkgJsonPath = path.resolve(rootPath, 'package.json');
// const pkgJsonRaw = fs.readFileSync(pkgJsonPath).toString();
// const { dependencies: appDeps } = JSON.parse(pkgJsonRaw);
// const appDepsList = Object.keys(appDeps);

const depNames = recursiveRead(srcPath);

const testDepNames = [
  'angular-mocks',
  'enzyme',
  'enzyme-adapter-react-16',
  'react-dom/test-utils',
  'sinon'
];

const stringifiedDeps = `
window.libs = [
  ${depNames.concat(testDepNames).map(depName => {
    return `\n\t['${depName}', require('${depName}')]`;
  })}
];
`;

const depsFilePath = path.resolve(rootPath, 'test', 'dependencies.js');

fs.writeFileSync(depsFilePath, stringifiedDeps);

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

    // Ignore .spec.js files
    if (isSpecFile) {
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
    enter: ({ node }) => {
      if (node.type === 'ImportDeclaration') {
        const value = node.source.value;
        // const realImport = value.split('/')[0];

        try {
          require.resolve(value);
        } catch (e) {
          return;
        }

        imports.push(value);
      }
    }
  });

  return imports;
}

// function isRealFile(filename) {
//   const resolved = path.resolve(srcPath, `${filename}.js`);
//
//   if (fs.existsSync(resolved)) {
//     return true;
//   }
//
//   return false;
// }
