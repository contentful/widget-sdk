'use strict';

// Shamelessly copied from gulp-jst-concat
const gUtil = require('gulp-util');
const PluginError = gUtil.PluginError;
const File = gUtil.File;
const through = require('through2');
const _ = require('lodash-node/modern');

function pluginError(message) {
  return new PluginError('./build-template', message);
}

function compile(file, renameKeys) {
  const name = file.path.replace(new RegExp(renameKeys[0]), renameKeys[1]);
  const contents = String(file.contents);

  return {
    name: name,
    fnSource: _.template(contents, null, {
      interpolate: /\${{([\s\S]+?)}}/g
    }).source
  };
}

function buildJSTString(files, renameKeys) {
  function compileAndRender(file) {
    const template = compile(file, renameKeys);
    return '"' + template.name + '":' + template.fnSource;
  }

  const templates = files.map(compileAndRender).join(',\n');
  return 'this.JST = {' + templates + '};';
}

module.exports = function jstConcat(fileName, _opts) {
  if (!fileName) throw pluginError('Missing fileName');

  const defaults = { renameKeys: ['.*', '$&'] };
  const opts = _.extend({}, defaults, _opts);
  const files = [];

  const stream = through.obj(write, end);
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
    const jstString = buildJSTString(files, opts.renameKeys);

    stream.push(
      new File({
        path: fileName,
        contents: new Buffer(jstString)
      })
    );

    done();
  }
};
