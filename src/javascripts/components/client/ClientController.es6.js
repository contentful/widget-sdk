import { registerController } from 'NgRegistry.es6';
import { onValueScope } from 'utils/kefir.es6';
import { pick, isObject } from 'lodash';
import isAnalyticsAllowed from 'analytics/isAnalyticsAllowed.es6';
import * as logger from 'services/logger.es6';
import * as Intercom from 'services/intercom.es6';
import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags.es6';

import { getSpaceFeature } from 'data/CMA/ProductCatalog.es6';
import store from 'redux/store.es6';
import * as EnforcementsService from 'services/EnforcementsService.es6';
import * as NavState from 'navigation/NavState.es6';
import * as CreateSpace from 'services/CreateSpace.es6';
import * as Analytics from 'analytics/Analytics.es6';
import * as TokenStore from 'services/TokenStore.es6';

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$state',
    'spaceContext',
    'authorization',
    '$rootScope',
    function ClientController($scope, $state, spaceContext, authorization, $rootScope) {
      const refreshNavState = NavState.makeStateRefresher($state, spaceContext);

      $rootScope.$on('$locationChangeSuccess', function() {
        store.dispatch({
          type: 'LOCATION_CHANGED',
          payload: { location: pickSerializable(window.location) }
        });

        if (shouldCheckUsageForCurrentLocation()) {
          spaceAndTokenWatchHandler({
            tokenLookup: TokenStore.getTokenLookup(),
            space: spaceContext.space,
            enforcements: EnforcementsService.getEnforcements(spaceContext.getId()),
            environmentId: spaceContext.getEnvironmentId()
          });
        }
      });

      // TODO remove this eventually. All components should access it as a service
      $scope.spaceContext = spaceContext;

      $scope.preferences = {
        showDisabledFields: false
      };

      $scope.$watchCollection(
        () => ({
          tokenLookup: TokenStore.getTokenLookup(),
          space: spaceContext.space,
          enforcements: EnforcementsService.getEnforcements(spaceContext.getId()),
          environmentId: spaceContext.getEnvironmentId()
        }),
        spaceAndTokenWatchHandler
      );

      onValueScope($scope, TokenStore.user$, handleUser);

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

      async function spaceAndTokenWatchHandler({
        tokenLookup,
        space,
        enforcements,
        environmentId
      }) {
        if (!tokenLookup) {
          return;
        }

        let newEnforcement = {};

        if (shouldCheckUsageForCurrentLocation()) {
          const spaceId = spaceContext.getId();
          const allowNewUsageCheck = await getSpaceFeature(
            spaceId,
            ENVIRONMENT_USAGE_ENFORCEMENT,
            false
          );

          if (allowNewUsageCheck) {
            newEnforcement = await EnforcementsService.newUsageChecker(spaceId, environmentId);
          }
        }

        authorization.update(
          tokenLookup,
          space,
          enforcements,
          environmentId,
          spaceContext.isMasterEnvironment(),
          newEnforcement
        );

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

      // usage/limits enforcement should happen only
      // on pages specific to entities
      function shouldCheckUsageForCurrentLocation() {
        const relevantPages = ['content_types', 'entries', 'assets'];
        const splitPathName = window.location.pathname.split('/');
        const currentPage = splitPathName[splitPathName.length - 1];

        return relevantPages.includes(currentPage);
      }
    }
  ]);
}
