const through = require('through2');
const Stream = require('stream');

module.exports.map = function map (fn) {
  return through.obj(function (value, _, push) {
    try {
      value = fn(value);
    } catch (error) {
      this.emit('error', error);
      return;
    }
    push(null, value);
  });
};

/**
 * Pipe an array of stream.
 *
 * Also forwards errors to the result stream.
 */
module.exports.pipe = function pipe (streams) {
  const [first, ...rest] = streams;
  return rest.reduce((piped, stream) => {
    piped.on('error', (e) => stream.emit('error', e));
    return piped.pipe(stream);
  }, first);
};

/**
 * Join a list of stream so that all data from the first stream is
 * emitted before the second stream, etc.
 */
module.exports.join = function join (streams) {
  let current;

  const out = new Stream.Readable({
    objectMode: true,
    read: read
  });

  readNextStream();

  return out;

  function read () {
    current.resume();
  }

  function emitReadable () {
    out.emit('readable');
  }

  function pushData (data) {
    const resume = out.push(data);
    if (!resume) {
      current.pause();
    }
  }

  function emitError (err) {
    out.emit('error', err);
  }

  function readNextStream () {
    if (current) {
      current.removeListener('readable', emitReadable);
      current.removeListener('data', pushData);
      current.removeListener('end', readNextStream);
      current.removeListener('error', emitError);
    }

    current = streams.shift();
    if (current) {
      current.on('readable', emitReadable);
      current.on('data', pushData);
      current.on('end', readNextStream);
      current.on('error', emitError);
    } else {
      out.push(null);
    }
  }
};
