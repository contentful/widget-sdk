import _ from 'lodash';

/**
 * @description
 * Creates a mock instance of a ShareJS document.
 *
 * The mock instance tries to simulate the behavior of a real ShareJS
 * document.
 *
 * Supported methods are
 * - `getAt(path)`
 * - `setAt(path, value, cb)`
 * - `at(path, value)`
 * - `get()`
 * - `set(value)`
 *
 * @usage[js]
 * doc = new OtDoc()
 * doc.setAt(['sub'], true)
 * doc.at('sub').set(false)
 * doc.getAt(['sub'])  // => false
 */
export default function ShareJsDocMock() {
  // TODO(mudit): Convert this from a contructor to a normal function
  // that returns an object with the methods. This would make it easier
  // to spy on stuff.
  function OtDoc(snapshot) {
    this.snapshot = snapshot || {};

    this.version = _.get(snapshot, ['sys', 'version']) || 0;

    this.on = _.noop;
    this.removeListener = _.noop;
    this.close = _.noop;
    this.shout = _.noop;
    this.pendingOp = false;
  }

  OtDoc.prototype.setAt = function (path, value, cb) {
    assertParentContainer(this.snapshot, path);
    if (path.length === 0) {
      this.snapshot = value;
    } else {
      _.set(this.snapshot, path, value);
    }
    this.version++;
    this.emit('change', [{ p: path }]);
    if (cb) {
      cb();
    }
  };

  // Supports only "si" and "sd".
  OtDoc.prototype.submitOp = function (ops, cb) {
    ops.forEach((op) => {
      const path = op.p.slice(0, op.p.length - 1);
      const pos = _.last(op.p);
      const val = this.getAt(path) || '';

      if (op.sd) {
        this.setAt(path, val.slice(0, pos) + val.slice(pos + op.sd.length));
      } else if (op.si) {
        this.setAt(path, val.slice(0, pos) + op.si + val.slice(pos));
      }
    });

    this.version++;
    this.emit(
      'change',
      ops.map((op) => op.p)
    );
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.getAt = function (path) {
    assertParentContainer(this.snapshot, path);
    return getAtPath(this.snapshot, path);
  };

  OtDoc.prototype.at = function (path) {
    return new SubDoc(this, path);
  };

  OtDoc.prototype.get = function () {
    return this.getAt([]);
  };

  OtDoc.prototype.set = function (val, cb) {
    this.setAt([], val, cb);
  };

  OtDoc.prototype.remove = function (cb) {
    const containerPath = this.path.slice(0, -1);
    const index = this.path.slice(-1)[0];
    const container = getAtPath(this.snapshot, containerPath);
    container.splice(index, 1);
    if (cb) {
      cb();
    }
  };

  OtDoc.prototype.removeAt = function (path, cb) {
    this.setAt(path, undefined, cb);
  };

  OtDoc.prototype.insert = function (index, value, cb) {
    const valAsArray = this.get().split('');
    valAsArray.splice(index, 0, value);
    const newValue = valAsArray.join('');
    this.set(newValue, cb);
  };

  OtDoc.prototype.insertAt = function (path, pos, value, cb) {
    try {
      const list = this.getAt(path);
      list.splice(pos, 0, value);
      this.emit('change', [{ p: path }]);
      cb();
    } catch (error) {
      cb(error);
    }
  };

  OtDoc.prototype.del = function (index, length, cb) {
    const valAsArray = this.get().split('');
    valAsArray.splice(index, length);
    const newValue = valAsArray.join('');
    this.set(newValue, cb);
  };

  OtDoc.prototype.emit = () => {};

  class SubDoc {
    constructor(root, path) {
      this.root = root;
      // This is an implementation quirk copied from the actual ShareJS
      // implementation. It basically converts a single string path,
      // like `a` into an array `['a']`.
      this.path = [].concat(path);
    }

    setAt(path, value, cb) {
      this.root.setAt(this.path.concat(path), value, cb);
    }

    set(value, cb) {
      this.setAt([], value, cb);
    }

    getAt(path) {
      return this.root.getAt(this.path.concat(path));
    }

    get() {
      return this.getAt([]);
    }

    at(path) {
      return new SubDoc(this.root, this.path.concat(path));
    }
  }

  jest.spyOn(OtDoc.prototype, 'insert');
  jest.spyOn(OtDoc.prototype, 'del');
  jest.spyOn(OtDoc.prototype, 'remove');
  jest.spyOn(OtDoc.prototype, 'removeAt');
  jest.spyOn(OtDoc.prototype, 'set');
  jest.spyOn(OtDoc.prototype, 'submitOp');

  function assertParentContainer(obj, path) {
    if (path.length < 1) {
      return;
    }

    path = path.slice(0, -1);
    if (!_.isObject(getAtPath(obj, path))) {
      throw new Error('Parent container does not exist');
    }
  }

  function getAtPath(obj, path) {
    if (Array.isArray(path) && path.length === 0) {
      return obj;
    } else {
      return _.get(obj, path);
    }
  }

  return OtDoc;
}
