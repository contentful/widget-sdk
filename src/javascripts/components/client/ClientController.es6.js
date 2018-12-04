angular.module('contentful').controller('ClientController', [
  '$scope',
  'require',
  function ClientController($scope, require) {
    const $state = require('$state');
    const K = require('utils/kefir.es6');
    const features = require('features');
    const logger = require('logger');
    const spaceContext = require('spaceContext');
    const TokenStore = require('services/TokenStore.es6');
    const Analytics = require('analytics/Analytics.es6');
    const authorization = require('authorization');
    const fontsDotCom = require('fontsDotCom');
    const CreateSpace = require('services/CreateSpace.es6');
    const refreshNavState = require('navigation/NavState.es6').makeStateRefresher(
      $state,
      spaceContext
    );
    const Intercom = require('intercom');
    const EnforcementsService = require('services/EnforcementsService.es6');
    const store = require('ReduxStore/store.es6').default;
    const $rootScope = require('$rootScope');
    const { pick } = require('lodash');

    $rootScope.$on('$locationChangeSuccess', function() {
      store.dispatch({
        type: 'LOCATION_CHANGED',
        payload: { location: pickSerializable(window.location) }
      });
    });

    // TODO remove this eventually. All components should access it as a service
    $scope.spaceContext = spaceContext;

    // TODO this does not belong here. We should move it to the
    // controller that actually uses it
    $scope.preferences = {
      showAuxPanel: false,
      toggleAuxPanel: function() {
        $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
      },
      showDisabledFields: false
    };

    $scope.$watchCollection(
      () => ({
        tokenLookup: TokenStore.getTokenLookup(),
        space: spaceContext.space,
        enforcements: EnforcementsService.getEnforcements(spaceContext.getId())
      }),
      spaceAndTokenWatchHandler
    );

    K.onValueScope($scope, TokenStore.user$, handleUser);

    $scope.showCreateSpaceDialog = CreateSpace.showDialog;

    function pickSerializable(location) {
      return pick(location, [
        'hash',
        'host',
        'hostname',
        'href',
        'origin',
        'pathname',
        'port',
        'protocol',
        'search'
      ]);
    }

    function spaceAndTokenWatchHandler({ tokenLookup, space, enforcements }) {
      if (!tokenLookup) {
        return;
      }

      authorization.update(tokenLookup, space, enforcements, spaceContext.getEnvironmentId());

      refreshNavState();
    }

    function handleUser(user) {
      if (!_.isObject(user)) {
        return;
      }

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
  }
]);
