'use strict';

import _ from 'lodash-node';
import through from 'through2';
import File from 'vinyl';
import Bluebird from 'bluebird';

export function makeVirtualFile (path, params) {
  var file = new File({
    cwd: '',
    base: '',
    path: path,
  });
  return _.extend(file, params);
}

export function map(fn) {
  fn = liftM(fn);
  return through.obj(function (file, _, next) {
    fn(file).nodeify(next);
  });
}

export function collect (fn, value) {
  fn = liftM(fn);
  return through.obj(function (file, _, next) {
    fn(value, file)
    .then(function (newValue) {
      value = newValue;
      return file;
    }).nodeify(next);
  }, function finished (next) {
    this.push(value);
    next();
  });

}

export function forEach (fn) {
  fn = liftM(fn);
  return map(function (file) {
    return fn(file).then(() => file);
  });
}

function liftM (fn) {
  return function lifted () {
    return Bluebird.resolve(fn.apply(null, arguments));
  };
}
