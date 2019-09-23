#!/usr/bin/env node

const fs = require('fs');
const { cpus } = require('os');
const path = require('path');
const { fork } = require('child_process');
const _ = require('lodash');

const rootPath = path.resolve(__dirname, '..', '..', '..');
const srcPath = path.resolve(rootPath, 'src', 'javascripts');
const depsFilePath = path.resolve(rootPath, 'build', 'dependencies-pre.js');

async function generate() {
  const testDepNames = [
    'angular-mocks',
    'enzyme',
    'enzyme-adapter-react-16',
    'react-dom/test-utils',
    'sinon'
  ];

  const depNames = [];
  const files = _.chunk(gatherFiles(srcPath), 100);

  const getChunk = () => {
    let chunk = files.splice(files.length - 1)[0];

    if (!chunk) {
      chunk = [];
    }

    return chunk;
  };

  const numCpus = cpus().length;

  // Create N workers (where N is number of cores)
  //
  // Each worker will take a chunk of files from the `files`` arr of arrays above,
  // process it, then return the imports. The worker will then get another chunk
  // or files. Once the worker gets nothing, it will exit.
  const workers = _.range(numCpus).map(() => {
    const worker = fork(require.resolve('./worker'));

    worker.on('message', data => {
      // Write a progress indicator period/dot
      print('.');

      depNames.push(data);

      // Send more files to the worker
      worker.send({ files: getChunk() });
    });

    return worker;
  });

  print(`Generating ${depsFilePath} `);

  // Send the initial file load
  workers.forEach(worker => {
    worker.send({ files: getChunk() });
  });

  // None of the workers should exit with non-0 status, but in case
  // one of the workers does, log the error and exit with 1.
  try {
    await waitForAllWorkers(workers);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }

  const uniqDeps = _.uniq(_.flatten(depNames));

  const stringifiedDeps = `
window.jQuery = window.$ = require('jquery');

window.libs = [
${uniqDeps
  .concat(testDepNames)
  .map(depName => {
    return `  ['${depName}', require('${depName}')]`;
  })
  .join(',\n')}
];
`;

  ensureBuildDirExists();

  fs.writeFileSync(depsFilePath, stringifiedDeps);

  print(' Done.', true);
}

function waitForAllWorkers(workers) {
  const promises = workers.map(worker => {
    return new Promise((resolve, reject) => {
      worker.on('exit', code => {
        if (code === 0) {
          resolve();
        } else {
          reject(code);
        }
      });
    });
  });

  return Promise.all(promises);
}

/*
  Recursively read through directory `p`, and determine the filenames
  of all non-test files in directory. Return an array of filenames.
 */
function gatherFiles(p) {
  const filenames = [];

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
      filenames.push(resolved);
    } else if (stats.isDirectory()) {
      filenames.push(gatherFiles(resolved));
    }
  });

  return _.flatten(filenames);
}

function ensureBuildDirExists() {
  fs.mkdirSync(path.resolve(rootPath, 'build'), { recursive: true });
}

function print(message, newline = false) {
  process.stdout.write(message);

  if (newline) {
    process.stdout.write('\n');
  }
}

module.exports = generate;

if (require.main === module) {
  generate();
}
