import _ from 'lodash';
import { getModule } from 'NgRegistry';

/**
 * @description
 * Read the value at the given path in the doc
 * @param {OtDoc} doc
 * @param {Array<string>} path
 * @return {any}
 */
export function peek(doc, path) {
  try {
    return doc.getAt(path);
  } catch (e) {
    // Catch synchronous errors and just return undefined.
  }
}

/**
 * @description
 * Remove the value at the given path in the doc
 * @param {OtDoc} doc
 * @param {Array<string>} path
 * @return {Promise<void>}
 */
export function remove(doc, path) {
  const $q = getModule('$q');
  return $q.denodeify(cb => {
    // We catch and ignore synchronous errors since they tell us
    // that a value along the path does not exist. I.e. it has
    // already been removed.
    try {
      doc.removeAt(path, cb);
    } catch (e) {
      cb();
    }
  });
}

/**
 * @description
 * Sets the value at the given path in the document.
 *
 * Works like `doc.setAt(path, value)` but also creates missing
 * intermediate containers.
 *
 * The function does not cause an update if the current value in
 * the document equals the new value. Deep comparison is used.
 *
 * If the new value is undefined, the value is removed.
 *
 * @param {OtDoc} doc
 * @param {Array<string>} path
 * @param {any} value
 * @return {Promise<void>}
 */
export function setDeep(doc, path, value) {
  const $q = getModule('$q');

  if (!doc) {
    throw new TypeError('No ShareJS document provided');
  }
  if (!path) {
    throw new TypeError('No path provided');
  }

  if (_.isEqual(value, peek(doc, path))) {
    return $q.resolve(value);
  }
  if (value === undefined) {
    return remove(doc, path);
  }

  return $q.denodeify(callback => {
    const container = getContainer(doc, path);
    const wrappedValue = makeDeepObject(container.restPath, value);
    container.doc.set(wrappedValue, callback);
  });
}

function makeDeepObject(path, value) {
  if (path.length === 0) {
    return value;
  } else {
    const obj = {};
    _.set(obj, path, value);
    return obj;
  }
}

function getContainer(doc, path) {
  let segment;
  path = path.slice();
  /* eslint no-cond-assign: "off" */
  while ((segment = path.shift())) {
    doc = doc.at(segment);
    const value = doc.get();
    const isContainer = _.isObject(value) || _.isArray(value);
    if (!isContainer) {
      break;
    }
  }
  return { doc: doc, restPath: path };
}
