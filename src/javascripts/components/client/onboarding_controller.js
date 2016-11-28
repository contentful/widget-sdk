'use strict';

angular.module('contentful')
.factory('onboardingController', ['$injector', function ($injector) {

  var $rootScope = $injector.get('$rootScope');
  var spaceContext = $injector.get('spaceContext');
  var modalDialog = $injector.get('modalDialog');
  var TheStore = $injector.get('TheStore');
  var authentication = $injector.get('authentication');
  var analytics = $injector.get('analytics');

  var SEEN_ONBOARDING_STORE_KEY = 'seenOnboarding';

  var unwatch;

  return {
    init: init,
    SEEN_ONBOARDING_STORE_KEY: SEEN_ONBOARDING_STORE_KEY
  };

  function init () {
    // Watch until we get the user object to work with.
    unwatch = $rootScope.$watch(function () {
      return dotty.get(authentication, 'tokenLookup.sys.createdBy');
    }, watcher);
  }

  function watcher (user) {
    if (user) {
      unwatch();
      showOnboardingIfNecessary(user);
    }
  }

  function showOnboardingIfNecessary (user) {
    var userSeenOnboarding = fetchSeenOnboarding();
    if (user.signInCount === 1 && !userSeenOnboarding) {
      showOnboarding();
      storeSeenOnboarding();
    } else {
      $rootScope.$broadcast('cfOmitOnboarding');
    }
  }

  function showOnboarding () {
    modalDialog.open({
      title: 'Onboarding', // Not displayed, just for analytics.
      template: 'create_new_space_dialog',
      persistOnNavigation: true,
      backgroundClose: false,
      ignoreEsc: true,
      scopeData: {
        isOnboarding: true
      }
    })
    .promise
    .then(handleSpaceCreationSuccess)
    .finally(function () {
      $rootScope.$broadcast('cfAfterOnboarding');
    });
  }

  // TODO: This is duplicate code from `ClientController`. Find out where to move it.
  function handleSpaceCreationSuccess (template) {
    if (template) {
      analytics.track('space:created_from_template', {
        templateName: template.name
      });
      return spaceContext.refreshContentTypesUntilChanged().then(function () {
        $rootScope.$broadcast('reloadEntries');
      });
    }
  }

  function fetchSeenOnboarding () {
    return TheStore.get(SEEN_ONBOARDING_STORE_KEY);
  }

  function storeSeenOnboarding () {
    TheStore.set(SEEN_ONBOARDING_STORE_KEY, true);
  }

}]);
