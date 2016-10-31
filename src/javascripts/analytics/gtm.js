'use strict';

angular.module('cf.app')
.factory('analytics/gtm', ['require', function (require) {
  var loadScript = require('LazyLoader').get;
  var global = window;
  var dataLayer = global.gtmDataLayer = [];

  var isDisabled = false;

  return {
    enable: enable,
    disable: disable,
    push: push
  };

  function enable () {
    if (isDisabled) {
      return;
    }
    loadScript('googleTagManager');
    push({
      'gtm.start': new Date().getTime(),
      'event': 'gtm.js'
    });
  }

  function push (obj) {
    if (!isDisabled) {
      dataLayer.push(obj);
    }
  }

  function disable () {
    isDisabled = true;
  }

}]);
