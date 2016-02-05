'use strict';

angular.module('contentful').factory('TheAccountView', ['$injector', function($injector) {

  var $state       = $injector.get('$state');
  var spaceContext = $injector.get('spaceContext');

  var isActive = false;

  return {
    goTo:             goTo,
    goToSubscription: goToSubscription,
    check:            check,
    isActive:         function() { return isActive; }
  };

  function goTo(pathSuffix, options) {
    $state.go('account.pathSuffix', { pathSuffix: pathSuffix }, options);
  }

  function goToSubscription(organizationId) {
    organizationId = spaceContext.getData('organization.sys.id');
    if (organizationId) {
      goTo('organizations/' + organizationId + '/subscription', { reload: true });
    }
  }

  function check() {
    isActive = $state.includes('account');
  }
}]);
