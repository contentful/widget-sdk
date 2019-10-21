import { registerController, appReady } from 'NgRegistry.es6';
import { onValueScope } from 'utils/kefir.es6';
import { pick, isObject } from 'lodash';
import authorization from 'services/authorization.es6';

import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags.es6';

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$state',
    'spaceContext',
    '$rootScope',
    function ClientController($scope, $state, spaceContext, $rootScope) {
      let isAnalyticsAllowed;
      let logger;
      let Intercom;
      let getSpaceFeature;
      let store;
      let EnforcementsService;
      let NavState;
      let CreateSpace;
      let Analytics;
      let TokenStore;
      let refreshNavState;

      // TODO remove this eventually. All components should access it as a service
      $scope.spaceContext = spaceContext;

      $scope.preferences = {
        showDisabledFields: false
      };

      $scope.appReady = false;
      $scope.controllerReady = false;

      initialize().then(() => {
        // We do this once
        store.dispatch({
          type: 'LOCATION_CHANGED',
          payload: { location: pickSerializable(window.location) }
        });

        $scope.$watchCollection(
          () => ({
            tokenLookup: TokenStore.getTokenLookup(),
            space: spaceContext.space,
            enforcements: EnforcementsService.getEnforcements(spaceContext.getId()),
            environmentId: spaceContext.getEnvironmentId()
          }),
          spaceAndTokenWatchHandler
        );

        // Wait for the app to be ready, via `appReady` from NgRegistry.
        //
        // See prelude.js and AngularInit.js.
        $scope.$watch(appReady, ready => {
          $scope.appReady = ready;
        });

        onValueScope($scope, TokenStore.user$, handleUser);

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

        $scope.controllerReady = true;
      });

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

      async function initialize() {
        [
          { default: isAnalyticsAllowed },
          logger,
          Intercom,
          { getSpaceFeature },
          { default: store },
          EnforcementsService,
          NavState,
          CreateSpace,
          Analytics,
          TokenStore
        ] = await Promise.all([
          import('analytics/isAnalyticsAllowed'),
          import('services/logger.es6'),
          import('services/intercom.es6'),
          import('data/CMA/ProductCatalog.es6'),
          import('redux/store.es6'),
          import('services/EnforcementsService.es6'),
          import('navigation/NavState.es6'),
          import('services/CreateSpace.es6'),
          import('analytics/Analytics'),
          import('services/TokenStore.es6')
        ]);

        refreshNavState = NavState.makeStateRefresher($state, spaceContext);

        $scope.showCreateSpaceDialog = CreateSpace.showDialog;
      }
    }
  ]);
}
