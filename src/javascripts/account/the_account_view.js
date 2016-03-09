'use strict';

angular.module('contentful').factory('TheAccountView', ['$injector', function($injector) {

  var $q           = $injector.get('$q');
  var $state       = $injector.get('$state');
  var spaceContext = $injector.get('spaceContext');

  var DEFAULT_PATH_SUFFIX = 'profile/user';

  var isActive = false;

  return {
    goToDefault:         goToDefault,
    goToSubscription:    goToSubscription,
    silentlyChangeState: silentlyChangeState,
    enter:               function () { isActive = true;  },
    exit:                function () { isActive = false; },
    isActive:            function () { return isActive;  }
  };

  function goTo(pathSuffix, options) {
    return $state.go('account.pathSuffix', { pathSuffix: pathSuffix }, options);
  }

  function goToDefault() {
    return goTo(DEFAULT_PATH_SUFFIX);
  }

  function goToSubscription() {
    var organizationId = spaceContext.getData('organization.sys.id');

    if (organizationId) {
      var pathSuffix = 'organizations/' + organizationId + '/subscription';
      return goTo(pathSuffix, {reload: true});
    } else {
      return $q.reject();
    }
  }

  function silentlyChangeState(pathSuffix) {
    if (pathSuffix) {
      return goTo(pathSuffix, {location: 'replace'});
    } else {
      return $q.reject();
    }
  }
}]);
