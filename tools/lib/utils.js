import * as B from 'bluebird';
import * as P from 'path';
import * as CP from 'child_process';


export const FS = B.promisifyAll(require('fs-extra'));

export const mkdirp = FS.mkdirsAsync.bind(FS);


/**
 * Read and parse a JSON file
 */
export function readJSON (path) {
  return FS.readFileAsync(path, 'utf8')
  .then(JSON.parse);
}


/**
 * Read and parse multiple JSON files and merge the objects.
 */
export function readMergeJSON (paths) {
  return B.all(paths.map(readJSON))
  .then((manifests) => {
    return Object.assign({}, ...manifests);
  });
}


/**
 * Stringify and write a JSON object to a file.
 */
export function writeJSON (path, obj) {
  return mkdirp(P.dirname(path))
  .then(() => {
    const content = JSON.stringify(obj);
    return FS.writeFileAsync(path, content, 'utf8');
  });
}


/**
 * Run a command and get the contents of `stdout`.
 */
export function exec (cmd, opts) {
  return new B.Promise(function (resolve, reject) {
    CP.exec(cmd, opts, function (error, stdout, stderr) {
      if (error) {
        error.stderr = stderr;
        error.stdout = stdout;
        reject(error);
      } else {
        resolve(stdout);
      }
    });
  });
}
