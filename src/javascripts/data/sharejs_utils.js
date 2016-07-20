'use strict';
/**
 * @ngdoc service
 * @name ShareJS
 *
 * @description
 * Initializes and provides access to ShareJS
 */
angular.module('cf.data')
.factory('data/ShareJS/Utils', ['require', function (require) {
  var $q = require('$q');

  return {
    setDeep: setDeep,
    peek: peek
  };


  /**
   * @ngdoc method
   * @name ShareJS#peek
   * @description
   * Read the value at the given path in the doc
   * @param {OtDoc} doc
   * @param {Array<string>} path
   * @return {any}
   */
  function peek (doc, path) {
    try {
      return doc.getAt(path);
    } catch (e) {
      return;
    }
  }


  /**
   * @ngdoc method
   * @name ShareJS#setDeep
   * @description
   * Sets the value at the given path in the document.
   *
   * Works like `doc.setAt(path, value)` but also creates missing
   * intermediate containers.
   *
   * The function does not cause an update if the current value in
   * the document equals the new value.
   *
   * @param {OtDoc} doc
   * @param {Array<string>} path
   * @param {any} value
   * @return {Promise<void>}
   */
  function setDeep (doc, path, value) {
    if (!doc) {
      throw new TypeError('No ShareJS document provided');
    }
    if (!path) {
      throw new TypeError('No path provided');
    }

    var current = peek(doc, path);
    if (value === current) {
      return $q.resolve();
    }

    return $q.denodeify(function (callback) {
      var container = getContainer(doc, path);
      var wrappedValue = makeDeepObject(container.restPath, value);
      container.doc.set(wrappedValue, callback);
    });
  }

  function makeDeepObject (path, value) {
    if (path.length === 0) {
      return value;
    } else {
      var obj = {};
      dotty.put(obj, path, value);
      return obj;
    }
  }

  function getContainer (doc, path) {
    var segment;
    path = path.slice();
    /* eslint no-cond-assign: "off" */
    while (segment = path.shift()) {
      doc = doc.at(segment);
      var value = doc.get();
      var isContainer = _.isObject(value) || _.isArray(value);
      if (!isContainer) {
        break;
      }
    }
    return {doc: doc, restPath: path};
  }
}]);
