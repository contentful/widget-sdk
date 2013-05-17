/*global jasmine*/
'use strict';

jasmine.AsyncBlock = function (env, func, spec, timeoutError) {
  this.timeoutError = timeoutError;
  jasmine.Block.call(this, env, func, spec);
};

jasmine.util.inherit(jasmine.AsyncBlock, jasmine.Block);

jasmine.AsyncBlock.prototype.execute = function (onComplete) {
  var completed = false;
  var self = this;
  var timeout = setTimeout(function () {
    self.spec.fail(self.timeoutError);
    onComplete();
    completed = true;
  }, 1000);
  var done = function(error){
    if (!completed) {
      if (error) self.spec.fail(error);
      clearTimeout(timeout);
      timeout = null;
      onComplete();
      completed = true;
    }
  };
  if (!jasmine.CATCH_EXCEPTIONS) {
    this.func.call(this.spec, done);
  } else {
    try {
      this.func.call(this.spec, done);
    } catch (e) {
      this.spec.fail(e);
      done();
    }
  }
};

jasmine.Spec.prototype.async = function (func) {
  var timeoutError = new Error('Async Block Timeout'); // Create potential error it here so it has a more useful Stacktrace
  var asyncBlock = new jasmine.AsyncBlock(this.env, func, this, timeoutError);
  this.addToQueue(asyncBlock);
  return this;
};
