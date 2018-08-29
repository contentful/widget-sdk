const B = require('bluebird');
const CP = require('child_process');

const FS = B.promisifyAll(require('fs-extra'));
module.exports.FS = FS;

const mkdirp = FS.mkdirsAsync.bind(FS);
module.exports.mkdirp = mkdirp;

/**
 * Read and parse a JSON file
 */
module.exports.readJSON = readJSON;

/**
 * Read and parse multiple JSON files and merge the objects.
 */
module.exports.readMergeJSON = function readMergeJSON(paths) {
  return B.all(paths.map(readJSON)).then(manifests => {
    return Object.assign({}, ...manifests);
  });
};

/**
 * Run a command and get the contents of `stdout`.
 */
module.exports.exec = function exec(cmd, opts) {
  return new B.Promise(function(resolve, reject) {
    CP.exec(cmd, opts, function(error, stdout, stderr) {
      if (error) {
        error.stderr = stderr;
        error.stdout = stdout;
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
};

function readJSON(path) {
  return FS.readFileAsync(path, 'utf8').then(JSON.parse);
}
