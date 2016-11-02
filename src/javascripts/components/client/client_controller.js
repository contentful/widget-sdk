'use strict';

angular.module('contentful')
.controller('ClientController', ['$scope', 'require', function ClientController ($scope, require) {
  var $rootScope = require('$rootScope');
  var $state = require('$state');
  var features = require('features');
  var logger = require('logger');
  var spaceContext = require('spaceContext');
  var authentication = require('authentication');
  var tokenStore = require('tokenStore');
  var analytics = require('analytics');
  var authorization = require('authorization');
  var modalDialog = require('modalDialog');
  var presence = require('presence');
  var revision = require('revision');
  var ReloadNotification = require('ReloadNotification');
  var OrganizationList = require('OrganizationList');
  var environment = require('environment');
  var fontsDotCom = require('fontsDotCom');

  // TODO remove this eventually. All components should access it as a service
  $scope.spaceContext = spaceContext;

  // TODO this does not belong here. We should move it to the
  // controller that actually uses it
  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function () {
      var showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
      trackToggleAuxPanel(showAuxPanel, $state.current.name);
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
      fontsDotCom.enable();
    } else {
      logger.disable();
      analytics.disable();
    }
  }

  function newVersionCheck () {
    if (environment.settings.disableUpdateCheck) {
      return;
    }
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
      spaceContext.refreshContentTypesUntilChanged().then(function () {
        $rootScope.$broadcast('reloadEntries');
      });
    } else {
      spaceContext.refreshContentTypes();
    }
  }

  function trackToggleAuxPanel (visible, stateName) {
    var action = visible ? 'Opened Aux-Panel' : 'Closed Aux-Panel';
    analytics.track(action, {
      currentState: stateName
    });
  }
}]);
