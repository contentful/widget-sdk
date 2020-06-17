#!/usr/bin/env node

const path = require('path');
const fs = require('fs');
const babel = require('@babel/core');
const trailduck = require('trailduck').default;
const { createBabelOptions } = require('../app-babel-options');
const _ = require('lodash');

/*
  This script determines the dependency graph for the application.

  These cases are handled:
  1. Plain imports, e.g. ImportDeclaration
  2. getModule statements
  3. Angular DI dependencies, and those via `$injector.get`
  4. Calls using `require`
 */

// These files are not imported asynchronously, and are handled differently
const exceptions = [
  'classes/spaceContext.es6.js',
  'components/client/ClientController.es6.js',
  'states/config.es6.js',
  'components/app_container/cfAppContainerDirective.es6.js',
  'navigation/Sidepanel/directive.es6.js',
  'components/shared/persistent_notification/cfPersistentNotificationDirective.es6.js',
];

const sourceDir = path.resolve(__dirname, '..', '..', 'src', 'javascripts');

// Read through the source directory, and determine the dependencies for each .js file
const dependencies = recursiveRead(sourceDir);

// Get all files that have Angular registrations and generate
// a dependency chain that Trailduck understands
const ngDependencyData = _.chain(dependencies)
  .pickBy((dependencyInfo) => dependencyInfo.registrations.length > 0)
  .mapValues((dependencyInfo) => ({
    dependenciesByFilename: determineChildren(dependencyInfo),
  }))
  .value();

Object.entries(ngDependencyData).forEach(([filename, { dependenciesByFilename }]) => {
  dependenciesByFilename.forEach(({ type, name, imp }) => {
    if (name === filename && type === 'indirect') {
      console.warn(`WARNING: "${filename}" has an external dependency on itself via ${imp}.`);
    }
  });
});

const ngDependencyByName = _.mapValues(ngDependencyData, (info) => ({
  children: info.dependenciesByFilename.map(({ name }) => name),
}));

const dfs = new trailduck(ngDependencyByName);
const list = dfs.ordered.map((node) => node.name);

console.log(
  '// The imports in this file are automatically generated by tools/bin/angular_dependency_order.js. Modify with caution.'
);

// Handle exception imports first
console.log(exceptions.map((exc) => topLevelImportString(exc)).join('\n'));
console.log(`\n\n\n\n----------------\n\n\n\n`);
console.log(exceptions.map((exc) => callString(exc)).join('\n'));
console.log(`\n\n\n\n----------------\n\n\n\n`);
console.log(`const modules = await Promise.all([
  ${list.map((item) => asyncImportString(item)).join(',\n')}
])`);
console.log('modules.forEach(module => module.default())');

/*
  Recursively read through directory `p`, and determine
  dependencies for each .js file.

  Returns object with filename as key and dependency info as value.
 */
function recursiveRead(p) {
  const dependencies = {};

  fs.readdirSync(p).forEach((name) => {
    const resolved = path.resolve(p, name);
    const isJsFile = resolved.endsWith('.js');
    const isSpecFile = isJsFile && resolved.endsWith('.spec.js');

    // Ignore .spec.js files
    if (isSpecFile) {
      return;
    }

    // Ignore exceptions
    if (exceptions.find((exception) => resolved.endsWith(exception))) {
      return;
    }

    const stats = fs.statSync(resolved);

    if (stats.isFile() && isJsFile) {
      const [filename, depInfo] = determineDependencies(resolved);

      dependencies[filename] = depInfo;
    } else if (stats.isDirectory()) {
      const dirDependencies = recursiveRead(resolved);

      Object.assign(dependencies, dirDependencies);
    }
  });

  return dependencies;
}

/*
  Parses given filename `p` through Babel and determines the following
  information:

  1. The directly imported files
  2. The registrations e.g. registerFactory
  3. The dependencies registered via Angular DI and $injector.get
  4. The indirect dependencies via getModule
  5. The dependencies via require
 */
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

  const regUtils = [
    'registerController',
    'registerDirective',
    'registerFilter',
    'registerFactory',
    'registerService',
    'registerConstant',
    'registerProvider',
    'registerValue',
  ];

  const registrations = [];
  const imports = [];
  const ng = [];
  const getModule = [];

  babel.traverse(ast, {
    enter: ({ node }) => {
      if (node.type === 'ImportDeclaration') {
        const value = node.source.value;

        imports.push(normalizeImport(p, value));
      }

      if (node.type === 'CallExpression') {
        const { callee, arguments: args } = node;

        // Ignore all non-string calls to these functions.
        if (!args[0] || args[0].type !== 'StringLiteral') {
          return;
        }

        // Angular module registration
        if (regUtils.includes(callee.name)) {
          registrations.push(args[0].value);

          if (args[1].type !== 'ArrayExpression') {
            return;
          }

          // DI registrations may be either an ng dependency or file
          args[1].elements.slice(0, -1).forEach(({ value: depName }) => {
            const [dependencyType, realDepName] = realDependencyWithType(depName);

            if (dependencyType === 'import') {
              imports.push(realDepName);
            } else if (dependencyType === 'ng') {
              ng.push(realDepName);
            }
          });
        }

        // getModule, assume only Angular
        if (callee.name === 'getModule') {
          getModule.push(args[0].value);
        }

        // require, assume only file
        if (callee.name === 'require') {
          const value = args[0].value;

          imports.push(normalizeImport(p, value));
        }

        // $injector.get, may be ng dependency or file
        if (
          _.get(callee, 'object.name') === '$injector' &&
          _.get(callee, 'property.name') === 'get'
        ) {
          const injectedNode = args[0];
          const depName = injectedNode.value;
          const [dependencyType, realDepName] = realDependencyWithType(depName);

          if (dependencyType === 'import') {
            imports.push(realDepName);
          } else if (dependencyType === 'ng') {
            ng.push(realDepName);
          }
        }
      }
    },
  });

  const filename = p.split('src/javascripts/')[1];

  return [
    filename,
    {
      imports,
      ng: _.uniq(ng),
      getModule,
      registrations,
    },
  ];
}

/*
  Given `depName`, return the type of the dependency with the "real" dependency
  name.

  There may be cases when something is imported without index.es6 appended, so
  there are two cases for `import` types. You cannot trust these implicitly, they
  may be fake news.

  The reality determining logic will not be necessary once all imports are explicit,
  e.g. all imported files use `index.es6` if needed.
 */
function realDependencyWithType(depName) {
  // For now, $injector.get could have either a filename or an Angular dep
  //
  // Determine if it is a file and if so, put it in imports. Otherwise, put in di

  // Since it cannot be relative, we can assume it comes from sourceDir
  const testPath = path.resolve(sourceDir, `${depName}.js`);
  const testPathWithIndex = path.resolve(sourceDir, `${depName}/index.es6.js`);

  if (fs.existsSync(testPath)) {
    return ['import', `${depName}.js`];
  } else if (fs.existsSync(testPathWithIndex)) {
    return ['import', `${depName}/index.es6.js`];
  } else {
    return ['ng', depName];
  }
}

/*
  Determines filename for given `ngDep`.
 */
function findFilenameForNgDep(ngDep) {
  // Special case: $filter
  if (ngDep === '$filter') {
    return 'filters.es6.js';
  }

  const found = Object.entries(dependencies).find(([, dep]) => dep.registrations.includes(ngDep));

  if (!found) {
    return null;
  }

  return found[0];
}

/*
  Gets all indirect imports, i.e. getModule uses in files
  directly imported.
 */
function getIndirectNgDeps(imp) {
  const dep = dependencies[`${imp}.js`];

  if (!dep) {
    return [];
  }

  const ngDeps = dep.ng.map((module) => module);
  const getModuleDeps = dep.getModule.map((module) => module);
  const importedDeps = dep.imports.map(getIndirectNgDeps);

  return _.flatten(ngDeps.concat(importedDeps, getModuleDeps));
}

/*
  Determines the children for given dependencies.
 */
function determineChildren(info) {
  // Get all DI and getModule deps (considered "direct" dependencies)
  const ngDeps = info.ng.map((module) => ({
    module,
    type: 'direct',
    imp: 'self',
  }));

  const getModuleDeps = info.getModule.map((module) => ({
    module,
    type: 'indirect',
    imp: 'self',
  }));

  // Get all indirect deps, via imported files
  const indirectDeps = _.flatten(
    info.imports.map((imp) =>
      getIndirectNgDeps(imp).map((module) => ({
        module,
        type: 'indirect',
        imp,
      }))
    )
  );

  return indirectDeps.concat(ngDeps, getModuleDeps).reduce((memo, def) => {
    const { module: name, type, imp } = def;
    const filenameForDep = findFilenameForNgDep(name);

    if (filenameForDep) {
      memo.push({
        name: filenameForDep,
        module: name,
        type,
        imp,
      });
    }

    return memo;
  }, []);
}

/*
  Normalizes import to path within src/javascripts, if relative.
 */
function normalizeImport(p, importName) {
  let normalized = path.resolve(sourceDir, importName);

  if (importName.startsWith('.')) {
    normalized = path.resolve(path.dirname(p), importName);
  }

  return normalized.split('src/javascripts/')[1];
}

function genDepName(filename) {
  return _.camelCase(filename.split('.js')[0]);
}

/*
  Generate import string used in AngularInit.js.

  By default returns a string like:

  `import dependencyName from 'dependencyName'`
 */
function topLevelImportString(filename) {
  const normalizedFilename = filename.split('.js')[0];
  const dependencyName = genDepName(filename);

  return `import ${dependencyName} from '${normalizedFilename}';`;
}

function asyncImportString(filename) {
  const normalizedFilename = filename.split('.js')[0];

  return `import('${normalizedFilename}')`;
}

function callString(filename) {
  const dependencyName = genDepName(filename);

  return `${dependencyName}();`;
}
