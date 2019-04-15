import { registerController } from 'NgRegistry.es6';
import { onValueScope } from 'utils/kefir.es6';
import { pick, isObject } from 'lodash';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed.es6';
import * as logger from 'services/logger.es6';
import * as Intercom from 'services/intercom.es6';

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$state',
    'spaceContext',
    'authorization',
    '$rootScope',
    'services/TokenStore.es6',
    'analytics/Analytics.es6',
    'services/CreateSpace.es6',
    'navigation/NavState.es6',
    'services/EnforcementsService.es6',
    'redux/store.es6',
    function ClientController(
      $scope,
      $state,
      spaceContext,
      authorization,
      $rootScope,
      TokenStore,
      Analytics,
      CreateSpace,
      NavState,
      EnforcementsService,
      { default: store }
    ) {
      const refreshNavState = NavState.makeStateRefresher($state, spaceContext);

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
        showDisabledFields: false,
        showAuxPanel: false,
        showCommentsPanel: false,
        toggleAuxPanel: function() {
          $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
          $scope.preferences.showCommentsPanel = false;
          broadcastPrefs($scope);
        },
        toggleCommentsPanel: () => {
          $scope.preferences.showAuxPanel = false;
          $scope.preferences.showCommentsPanel = !$scope.preferences.showCommentsPanel;
          broadcastPrefs($scope);
        }
      };

      $scope.$watchCollection(
        () => ({
          tokenLookup: TokenStore.getTokenLookup(),
          space: spaceContext.space,
          enforcements: EnforcementsService.getEnforcements(spaceContext.getId())
        }),
        spaceAndTokenWatchHandler
      );

      onValueScope($scope, TokenStore.user$, handleUser);

      $scope.showCreateSpaceDialog = CreateSpace.showDialog;

      function broadcastPrefs($scope) {
        $rootScope.$broadcast('show-aux-panel', $scope.preferences.showAuxPanel);
        $rootScope.$broadcast('show-comments-panel', $scope.preferences.showCommentsPanel);
      }

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
        if (!isObject(user)) {
          return;
        }

        $scope.user = user;

        if (isAnalyticsAllowed(user)) {
          logger.enable(user);
          Analytics.enable(user);
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
}
