'use strict';
/**
 * @ngdoc service
 * @name authentication/token
 *
 * @description
 * This service is responsible for storing the access token used by the CMA
 */

angular.module('contentful')
.factory('authentication/token', ['require', function (require) {

  var K = require('utils/kefir');
  var TheStore = require('TheStore');

  var accessToken = TheStore.get('token');
  var bus = K.createPropertyBus(accessToken);

  return {
    get: function () {
      return accessToken;
    },
    set: function (token) {
      accessToken = token;
      TheStore.set('token', token);
      bus.set(accessToken);
      return accessToken;
    },
    clear: function () {
      accessToken = null;
      TheStore.remove('token');
    },
    token$: bus.property
  };
}]);
