'use strict';

// Code related to the hidden Property is from http://www.html5rocks.com/en/tutorials/pagevisibility/intro/
angular.module('contentful')
.factory('presence', ['require', function (require) {
  var TIMEOUT = 10 * 60 * 1000;
  var debounce = require('debounce');
  var lastActive = Date.now();

  var trackActivity = debounce(function () {
    lastActive = Date.now();
  }, 1000 * 10);

  return {
    isActive: isActive,
    startTracking: startTracking
  };


  function isActive () {
    var now = Date.now();
    return !isHidden() && (now - lastActive < TIMEOUT);
  }


  function startTracking () {
    $(document).on('keydown mousemove', trackActivity);
  }


  function isHidden () {
    var prop = getHiddenProp();
    if (!prop) return false;

    return document[prop];
  }


  function getHiddenProp () {
    var prefixes = ['webkit', 'moz', 'ms', 'o'];

    // if 'hidden' is natively supported just return it
    if ('hidden' in document) return 'hidden';

    // otherwise loop over all the known prefixes until we find one
    for (var i = 0; i < prefixes.length; i++) {
      if ((prefixes[i] + 'Hidden') in document) {
        return prefixes[i] + 'Hidden';
      }
    }

    // otherwise it's not supported
    return null;
  }
}]);
