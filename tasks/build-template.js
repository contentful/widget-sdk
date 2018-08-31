'use strict';

// Shamelessly copied from gulp-jst-concat
var gUtil = require('gulp-util');
var PluginError = gUtil.PluginError;
var File = gUtil.File;
var through = require('through2');
var _ = require('lodash-node/modern');

function pluginError(message) {
  return new PluginError('./build-template', message);
}

function compile(file, renameKeys) {
  var name = file.path.replace(new RegExp(renameKeys[0]), renameKeys[1]);
  var contents = String(file.contents);

  return {
    name: name,
    fnSource: _.template(contents, null, {
      interpolate: /\${{([\s\S]+?)}}/g
    }).source
  };
}

function buildJSTString(files, renameKeys) {
  function compileAndRender(file) {
    var template = compile(file, renameKeys);
    return '"' + template.name + '":' + template.fnSource;
  }

  var templates = files.map(compileAndRender).join(',\n');
  return 'this.JST = {' + templates + '};';
}

module.exports = function jstConcat(fileName, _opts) {
  if (!fileName) throw pluginError('Missing fileName');

  var defaults = { renameKeys: ['.*', '$&'] };
  var opts = _.extend({}, defaults, _opts);
  var files = [];

  var stream = through.obj(write, end);
  return stream;

  function write(file, _enc, done) {
    if (file.isStream()) {
      stream.emit('error', pluginError('Streaming not supported'));
    } else if (file.isBuffer()) {
      files.push(file);
    }
    done();
  }

  function end(done) {
    var jstString = buildJSTString(files, opts.renameKeys);

    stream.push(
      new File({
        path: fileName,
        contents: new Buffer(jstString)
      })
    );

    done();
  }
};
