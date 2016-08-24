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
  // TODO(mudit): Convert this from a contructor to a normal function
  // that returns an object with the methods. This would make it easier
  // to spy on stuff.
  function OtDoc (snapshot, path) {
    this.snapshot = snapshot || {};
    this.path = path || [];

    // TODO this should be automatically incremented when we change
    // something.
    this.version = 0;

    this.on = sinon.stub();
    this.removeListener = sinon.stub();
    this.close = sinon.stub();
    this.shout = sinon.spy();
  }

  OtDoc.prototype.setAt = function (path, value, cb) {
    path = this.path.concat(path);
    assertParentContainer(this.snapshot, path);
    dotty.put(this.snapshot, path, value);
    if (cb) {
      cb();
    }
  };

  // Supports only "si" and "sd".
  OtDoc.prototype.submitOp = function (ops, cb) {
    ops.forEach((op) => {
      var path = op.p.slice(0, op.p.length - 1);
      var pos = _.last(op.p);
      var val = this.getAt(path) || '';

      if (op.sd) {
        this.setAt(path, val.slice(0, pos) + val.slice(pos + op.sd.length));
      } else if (op.si) {
        this.setAt(path, val.slice(0, pos) + op.si + val.slice(pos));
      }
    });

    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.getAt = function (path) {
    path = this.path.concat(path);
    assertParentContainer(this.snapshot, path);
    return dotty.get(this.snapshot, path);
  };

  OtDoc.prototype.at = function (path) {
    // Assumes that `at` is only called with one segment. This might
    // not be true.
    return new OtDoc(this.snapshot, this.path.concat(path));
  };

  OtDoc.prototype.get = function () {
    return this.getAt([]);
  };

  OtDoc.prototype.set = function (val, cb) {
    this.setAt([], val, cb);
  };

  OtDoc.prototype.remove = function (cb) {
    var containerPath = this.path.slice(0, -1);
    var index = this.path.slice(-1)[0];
    var container = dotty.get(this.snapshot, containerPath);
    container.splice(index, 1);
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.removeAt = function (path, cb) {
    dotty.put(this.snapshot, path, undefined);
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.insert = function (index, value, cb) {
    var valAsArray = this.get().split('');
    valAsArray.splice(index, 0, value);
    var newValue = valAsArray.join('');
    this.set(newValue, cb);
  };

  OtDoc.prototype.insertAt = function (path, pos, value, cb) {
    var list = this.getAt(path);
    list.splice(pos, 0, value);
    cb();
  };

  OtDoc.prototype.del = function (index, length, cb) {
    var valAsArray = this.get().split('');
    valAsArray.splice(index, length);
    var newValue = valAsArray.join('');
    this.set(newValue, cb);
  };

  OtDoc.prototype.emit = function () {};

  sinon.spy(OtDoc.prototype, 'insert');
  sinon.spy(OtDoc.prototype, 'del');
  sinon.spy(OtDoc.prototype, 'remove');
  sinon.spy(OtDoc.prototype, 'removeAt');
  sinon.spy(OtDoc.prototype, 'set');
  sinon.spy(OtDoc.prototype, 'submitOp');

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
