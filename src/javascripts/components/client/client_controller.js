'use strict';

angular.module('contentful')
.controller('ClientController', ['$scope', 'require', function ClientController ($scope, require) {
  const $state = require('$state');
  const K = require('utils/kefir');
  const features = require('features');
  const logger = require('logger');
  const spaceContext = require('spaceContext');
  const TokenStore = require('services/TokenStore');
  const Analytics = require('analytics/Analytics');
  const authorization = require('authorization');
  const fontsDotCom = require('fontsDotCom');
  const CreateSpace = require('services/CreateSpace');
  const refreshNavState = require('navigation/NavState').makeStateRefresher($state, spaceContext);
  const Intercom = require('intercom');
  const makeFetchEnforcements = require('data/CMA/EnforcementsInfo').default;
  const auth = require('Authentication');

  const fetchEnforcements = makeFetchEnforcements(auth);

  // TODO remove this eventually. All components should access it as a service
  $scope.spaceContext = spaceContext;

  // TODO this does not belong here. We should move it to the
  // controller that actually uses it
  $scope.preferences = {
    showAuxPanel: false,
    toggleAuxPanel: function () {
      const showAuxPanel = !$scope.preferences.showAuxPanel;
      $scope.preferences.showAuxPanel = showAuxPanel;
    },
    showDisabledFields: false
  };

  $scope.$watchCollection(() => ({
    space: spaceContext.space,
    tokenLookup: TokenStore.getTokenLookup()
  }), spaceAndTokenWatchHandler);

  K.onValueScope($scope, TokenStore.user$, handleUser);

  $scope.showCreateSpaceDialog = CreateSpace.showDialog;

  async function spaceAndTokenWatchHandler (collection) {
    if (collection.tokenLookup) {
      authorization.setTokenLookup(collection.tokenLookup, null, spaceContext.getEnvironmentId());

      if (collection.space && authorization.authContext && authorization.authContext.hasSpace(collection.space.getId())) {
        const enforcements = await fetchEnforcements(collection.space.getId());
        authorization.setSpace(collection.space, enforcements);
      }
      refreshNavState();
    }
  }

  function handleUser (user) {
    if (!_.isObject(user)) { return; }

    $scope.user = user;

    if (features.allowAnalytics(user)) {
      logger.enable(user);
      Analytics.enable(user);
      fontsDotCom.enable();
    } else {
      logger.disable();
      Analytics.disable();
      // Intercom is enabled by default, but because it is loaded by Segment,
      // it will only be available when Analytics/Segment is.
      Intercom.disable();
    }
  }
}]);
