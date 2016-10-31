'use strict';

/**
 * @ngdoc service
 * @name analytics
 * @description
 *
 * This service provides an object with different methods to trigger
 * analytics events. External services are called only in production
 * and staging environments.
 */
angular.module('contentful')

.factory('analytics', ['require', function (require) {
  var whitelist = ['production', 'staging'];
  var env = dotty.get(require('environment'), 'env');
  var serviceName = _.includes(whitelist, env) ? 'track' : 'noop';

  return require('analytics/' + serviceName);
}]);
