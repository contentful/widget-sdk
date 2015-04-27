'use strict';

var _ = require('lodash-node');
var path = require('path');
var proxyquire = require('proxyquire');

module.exports = loadSubtasks;

function loadSubtasks (gulp, dir) {
  var gulpfile = path.resolve(dir, 'gulpfile.js');
  var proxy = new GulpProxy(gulp, dir);
  proxyquire(gulpfile, {gulp: proxy});
}

function GulpProxy (gulp, dir) {
  this._base = gulp;
  this._dir = dir;
}

GulpProxy.prototype.src = function (globs, options) {
  options = this._setCwd(options)
  if (options.base)
    options.base = path.join(options.cwd, options.base)
  return this._base.src(globs, this._setCwd(options));
};

GulpProxy.prototype.dest = function (globs, options) {
  return this._base.dest(globs, this._setCwd(options));
};

GulpProxy.prototype.task = function (name, deps, run) {
  name = this._prefix(name);
  if (Array.isArray(deps))
    deps = _.map(deps, this._prefix, this);

  return this._base.task(name, deps, run);
};

GulpProxy.prototype.watch = function (globs, options, run) {
  if (!run) {
    run = options;
    options = this._setCwd({});
  } else {
    options = this._setCwd(options);
  }

  if (Array.isArray(run))
    run = _.map(run, this._prefix, this);

  return this._base.watch(globs, options, run);
};

GulpProxy.prototype._prefix = function (name) {
  if (name === 'default')
    return this._dir;
  else
    return path.join(this._dir, name);
};

GulpProxy.prototype._setCwd = function (options) {
  var cwd = path.resolve(this._dir);
  return _.defaults({cwd: cwd}, options);
};
