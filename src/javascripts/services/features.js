'use strict';
angular.module('contentful').factory('features', ['$injector', function FeaturesFactory($injector) {
  var authentication = $injector.get('authentication');

  return {
    shouldAllowAnalytics: shouldAllowAnalytics
  };

  function shouldAllowAnalytics() {
    var user          = authentication.getUser();
    var organizations = _.pluck(user.organizationMemberships, 'organization');

    var disallowAnalytics = dotty.get(user, 'features.logAnalytics') === false;
    disallowAnalytics = disallowAnalytics || _.any(organizations, function(org){
      return org.disableAnalytics === true;
    });

    return !disallowAnalytics;
  }
}]);
