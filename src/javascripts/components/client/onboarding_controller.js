'use strict';

angular.module('contentful')
.factory('onboardingController', ['$injector', function ($injector) {

  var $rootScope     = $injector.get('$rootScope');
  var spaceContext   = $injector.get('spaceContext');
  var modalDialog    = $injector.get('modalDialog');
  var TheStore       = $injector.get('TheStore');
  var authentication = $injector.get('authentication');
  var analytics      = $injector.get('analytics');
  var $timeout       = $injector.get('$timeout');

  var SEEN_ONBOARDING_STORE_KEY = 'seenOnboarding';

  return {
    init: init,
    SEEN_ONBOARDING_STORE_KEY: SEEN_ONBOARDING_STORE_KEY
  };

  function init () {
    // Watch until we get the user object to work with.
    $rootScope.$watch(function () {
      return dotty.get(authentication, 'tokenLookup.sys.createdBy');
    }, watcher);

    $rootScope.$on('skipPersonaSelection', storeSeenOnboarding);
    $rootScope.$on('submitPersonaSelection', storeSeenOnboarding);
  }

  function watcher (user) {
    if (user) {
      showOnboardingIfNecessary(user);
    }
  }

  function showOnboardingIfNecessary (user) {
    var seenOnboarding = fetchSeenOnboarding();
    var signInCount = user.signInCount;
    if (signInCount === 1 && !seenOnboarding) {
      showOnboarding();
    }
  }

  function showOnboarding () {
    modalDialog.open({
      title: 'Onboarding', // Not displayed, just for analytics.
      template: 'onboarding_dialog',
      persistOnNavigation: true,
      backgroundClose: false,
      ignoreEsc: true,
      scopeData: {
        isOnboarding: true
      }
    })
    .promise
    .then(handleSpaceCreationSuccess);
  }

  // TODO: This is duplicate code from `ClientController`. Find out where to move it.
  function handleSpaceCreationSuccess (template) {
    if (template) {
      analytics.track('Created Space Template', {template: template.name});
      $rootScope.$broadcast('reloadEntries');
      $timeout(function () {
        spaceContext.refreshContentTypes();
      }, 1000);
    }
  }

  function fetchSeenOnboarding () {
    return TheStore.get(SEEN_ONBOARDING_STORE_KEY);
  }

  function storeSeenOnboarding () {
    TheStore.set(SEEN_ONBOARDING_STORE_KEY, true);
  }

}]);
