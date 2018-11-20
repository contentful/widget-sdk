import _ from 'lodash';

export function create() {
  let pathsToRestore = [];
  const restoreFns = [];
  let differenceCount = 0;

  return {
    keep,
    keepAll,
    restore,
    registerPath,
    restoreAll,
    getPathsToRestore,
    getDifferenceCount
  };

  /**
   * @param {array} path
   * @description
   * Marks path as "kept": current version
   * should be used
   */
  function keep(path) {
    _.pull(pathsToRestore, path.join('.'));
  }

  /**
   * @description
   * Marks all paths as "kept"
   */
  function keepAll() {
    pathsToRestore = [];
  }

  /**
   * @param {array} path
   * @description
   * Marks path as "restored": snapshot
   * version should be used
   */
  function restore(path) {
    const joined = path.join('.');
    if (pathsToRestore.indexOf(joined) < 0) {
      pathsToRestore.push(joined);
    }
  }

  /**
   * @param {object} spec
   * @description
   * Control for each path should register
   * itself. There are two options:
   * - restoreFn - action that should be
   *   performed when path is restored
   * - isDifferent - boolean flag
   */
  function registerPath(spec) {
    restoreFns.push(spec.restoreFn || _.noop);
    if (spec.isDifferent) {
      differenceCount += 1;
    }
  }

  /**
   * @description
   * Calls "restoreFn" of all paths
   */
  function restoreAll() {
    restoreFns.forEach(fn => {
      fn();
    });
  }

  /**
   * @returns {string[][]}
   * @description
   * Gets an array of paths to restore
   */
  function getPathsToRestore() {
    return pathsToRestore.map(path => path.split('.'));
  }

  /**
   * @returns {number}
   * @description
   * Gets an array of paths to restore
   */
  function getDifferenceCount() {
    return differenceCount;
  }
}
