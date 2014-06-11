angular.module('contentful').factory('cfSpinner', function (throttle) {
  'use strict';

  var counter = 0;

  var increaseSpin = function () {
    counter++;
    //console.log('increase spinner', counter);
    startStop();
  };

  var decreaseSpin = function () {
    counter--;
    //console.log('decrese spinner', counter);
    startStop();
  };

  var running = false;
  var startStop = throttle(function () {
    var newState = 0 < counter;
    if (newState != running) {
      //console.log('spinner changing state to', newState);
      if (spinCallback) spinCallback(newState);
      running = newState;
    }
  }, 40);

  var spinCallback;

  var Spinner = {
    start: function(time){
      var timeout;
      time = time || 1000*10;
      var stop = function(){
        if (timeout) {
          decreaseSpin();
          clearTimeout(timeout);
          timeout = null;
        }
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
