import _ from 'lodash';

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
  return new Promise(resolve => {
    // We catch and ignore synchronous errors since they tell us
    // that a value along the path does not exist. I.e. it has
    // already been removed.
    try {
      doc.removeAt(path, resolve);
    } catch (e) {
      resolve();
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
  if (!doc) {
    throw new TypeError('No ShareJS document provided');
  }
  if (!path) {
    throw new TypeError('No path provided');
  }

  if (_.isEqual(value, peek(doc, path))) {
    return Promise.resolve(value);
  }
  if (value === undefined) {
    return remove(doc, path);
  }

  return new Promise(resolve => {
    const container = getContainer(doc, path);
    const wrappedValue = makeDeepObject(container.restPath, value);
    container.doc.set(wrappedValue, resolve);
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
