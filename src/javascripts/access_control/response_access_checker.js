'use strict';

angular.module('contentful').factory('responseAccessChecker', ['$injector', function ($injector) {

  var $q = $injector.get('$q');

  return {
    isForbidden: isForbidden,
    withContext: withContext
  };

  function isForbidden(err) {
    return _.contains([403, 404], dotty.get(err, 'statusCode'));
  }

  function withContext(context) {
    return function (err) {
      if (isForbidden(err)) {
        context.forbidden = true;
        return $q.when(context);
      } else {
        return $q.reject(err);
      }
    };
  }
}]);
