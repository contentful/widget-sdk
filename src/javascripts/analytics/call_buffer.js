'use strict';
angular.module('contentful').constant('CallBuffer', (function(){

  var OPEN = 'open', RESOLVED = 'resolved', DISABLED = 'disabled';

  /**
   * A service that records computations while in the initial open state.
   * When you resolve the Callbuffer then buffered computations are executed.
   *
   * Afterwards, subsequent computations are executed immediately and synchronously.
   *
   * Instead of resolving you can also disable the Callbuffer.
   * That discards all buffered computations.
   * Future computations are discarded immediately.
   *
   * After being resolved or disabled, the CallBuffer can not be
   * transitioned into another state anymore
   */
  function CallBuffer(){
    this._calls = [];
    this._state = OPEN;
  }

  CallBuffer.prototype.call = function(fn){
    if (this._state === RESOLVED) {
      fn();
    } else if (this._state === DISABLED) {
      void 0;
    } else {
      this._calls.push(fn);
    }
  };

  CallBuffer.prototype.resolve = function(){
    /*jshint boss:true*/
    if (this._state === OPEN) {
      this._state = RESOLVED;
      var call;
      while (call = this._calls.shift()){
        call();
      }
      this._calls = [];
    }
  };

  CallBuffer.prototype.disable = function(){
    this._state = DISABLED;
    this._calls = [];
  };

  return CallBuffer;
})());
