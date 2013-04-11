angular.module('contentful/services').service('cfSpinner', function () {
  'use strict';

  var counter = 0;

  var increaseSpin = function () {
    counter++;
    startStop();
  };

  var decreaseSpin = function () {
    counter--;
    startStop();
  };

  var startStop = function () {
    if (spinCallback) spinCallback(0 < counter);
  };

  var spinCallback;

  var Spinner = {
    start: function(time){
      var timeout;
      time = time || 1000*10;
      var stop = function(){
        decreaseSpin();
        clearTimeout(timeout);
        timeout = null;
      };
      increaseSpin();
      timeout = setTimeout(stop, time);
      return stop;
    },

    stopAll: function () {
      counter = 0;
      startStop();
    },

    setCallback: function (callback) {
      spinCallback = callback;
    }
  };

  return Spinner;
  
});
