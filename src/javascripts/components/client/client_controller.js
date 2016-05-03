'use strict';

angular.module('contentful')
.controller('ClientController', ['$scope', '$injector', function ClientController ($scope, $injector) {
  var $rootScope = $injector.get('$rootScope');
  var $state = $injector.get('$state');
  var features = $injector.get('features');
  var logger = $injector.get('logger');
  var spaceContext = $injector.get('spaceContext');
  var authentication = $injector.get('authentication');
  var tokenStore = $injector.get('tokenStore');
  var analytics = $injector.get('analytics');
  var analyticsEvents = $injector.get('analyticsEvents');
  var authorization = $injector.get('authorization');
  var modalDialog = $injector.get('modalDialog');
  var presence = $injector.get('presence');
  var revision = $injector.get('revision');
  var ReloadNotification = $injector.get('ReloadNotification');
  var OrganizationList = $injector.get('OrganizationList');
  var environment = $injector.get('environment');

  // TODO remove this eventually. All components should access it as a service
  $scope.spaceContext = spaceContext;

  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function () {
      var showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
      analyticsEvents.trackToggleAuxPanel(showAuxPanel, $state.current.name);
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(function () {
    return {
      space: spaceContext.space,
      tokenLookup: authentication.tokenLookup
    };
  }, spaceAndTokenWatchHandler);

  var off = tokenStore.changed.attach(handleTokenData);
  $scope.$on('$destroy', off);

  // @todo remove it - temporary proxy event handler (2 usages)
  $scope.$on('showCreateSpaceDialog', showCreateSpaceDialog);

  $scope.initClient = initClient;
  $scope.showCreateSpaceDialog = showCreateSpaceDialog;
  $scope.baseHost = environment.settings.base_host;

  function initClient () {
    tokenStore.refresh();

    setTimeout(newVersionCheck, 5000);

    setInterval(function () {
      if (presence.isActive()) {
        newVersionCheck();
        tokenStore.refresh()
        .catch(function () {
          ReloadNotification.trigger('Your authentication data needs to be refreshed. Please try logging in again.');
        });
      }
    }, 5 * 60 * 1000);
  }

  function spaceAndTokenWatchHandler (collection) {
    if (collection.tokenLookup) {
      authorization.setTokenLookup(collection.tokenLookup);
      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId())) {
        authorization.setSpace(collection.space);
      }
    }
  }

  function handleTokenData (token) {
    var user = dotty.get(token, 'user');
    if (!_.isObject(user)) { return; }

    $scope.user = user;
    OrganizationList.resetWithUser(user);

    if (features.allowAnalytics(user)) {
      logger.enable(user);
      analytics.enable(user);
    } else {
      logger.disable();
      analytics.disable();
    }
  }

  function newVersionCheck () {
    revision.hasNewVersion().then(function (hasNewVersion) {
      if (hasNewVersion) {
        $rootScope.$broadcast('persistentNotification', {
          message: 'A new application version is available. Please reload to get a new version of the application',
          action: ReloadNotification.triggerImmediateReload,
          actionMessage: 'Reload'
        });
      }
    });
  }

  function showCreateSpaceDialog () {
    analytics.track('Clicked Create-Space');
    modalDialog.open({
      title: 'Space templates',
      template: 'create_new_space_dialog',
      backgroundClose: false,
      persistOnNavigation: true
    })
    .promise
    .then(handleSpaceCreationSuccess)
    .catch(function () {
      analytics.track('Closed Space Template Selection Modal');
    });
  }

  function handleSpaceCreationSuccess (template) {
    if (template) {
      analytics.track('Created Space Template', {template: template.name});
      $rootScope.$broadcast('reloadEntries');
      spaceContext.refreshContentTypesUntilChanged();
    } else {
      spaceContext.refreshContentTypes();
    }
  }
}]);
