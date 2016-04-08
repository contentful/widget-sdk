'use strict';

/**
 * @ngdoc service
 * @module contentful/mocks
 * @name mocks/OtDoc
 * @description
 * Creates a mock instance of a ShareJS document.
 *
 * Supported methods are
 * - `getAt(path)`
 * - `setAt(path, value, cb)`
 * - `at(path, value)`
 * - `get()`
 * - `set(value)`
 *
 * @usage[js]
 * var OtDoc = this.$inject('mocks/OtDoc')
 * doc = new OtDoc()
 * doc.setAt(['sub'], true)
 * doc.at('sub').set(false)
 * doc.getAt(['sub'])  // => false
 */
angular.module('contentful/mocks')
.factory('mocks/OtDoc', [function () {
  function OtDoc (snapshot, base) {
    this.snapshot = snapshot || {};
    this.base = base || [];
  }

  OtDoc.prototype.setAt = function (path, value, cb) {
    path = this.base.concat(path);
    assertParentContainer(this.snapshot, path);
    dotty.put(this.snapshot, path, value);
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.getAt = function (path) {
    path = this.base.concat(path);
    assertParentContainer(this.snapshot, path);
    return dotty.get(this.snapshot, path);
  };

  OtDoc.prototype.at = function (path) {
    // Assumes that `at` is only called with one segment. This might
    // not be true.
    return new OtDoc(this.snapshot, this.base.concat([path]));
  };

  OtDoc.prototype.get = function () {
    return this.getAt([]);
  };

  OtDoc.prototype.set = function (val, cb) {
    this.setAt([], val, cb);
  };

  OtDoc.prototype.remove = function (cb) {
    var containerPath = this.base.slice(0, -1);
    var index = this.base.slice(-1)[0];
    var container = dotty.get(this.snapshot, containerPath);
    container.splice(index, 1);
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.insert = function (index, value, cb) {
    this.get().splice(index, 0, value);
    if (cb) {
      cb();
    }
  };

  return OtDoc;


  function assertParentContainer (obj, path) {
    if (path.length < 1) {
      return;
    }

    path = path.slice(0, -1);
    if (!_.isObject(dotty.get(obj, path))) {
      throw new Error('Parent container does not exist');
    }
  }
}]);
