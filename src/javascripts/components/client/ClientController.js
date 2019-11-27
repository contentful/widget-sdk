import { registerController, appReady } from 'NgRegistry';
import { onValueScope } from 'utils/kefir';
import { pick, isObject } from 'lodash';
import authorization from 'services/authorization';

import { ENVIRONMENT_USAGE_ENFORCEMENT } from 'featureFlags';
import {
  createPubSubClientForSpace,
  ENVIRONMENT_ALIAS_CHANGED_EVENT
} from 'services/PubSubService';
import initEnvAliasChangeHandler from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';

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
      let pubsubClient;
      let pubsubSubscribed;

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
        const spaceId = spaceContext.getId();

        if (shouldCheckUsageForCurrentLocation()) {
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

        if (pubsubClient && pubsubSubscribed) {
          // when switching spaces or accessing org settings
          // the previous spaceId listeners have to be removed
          pubsubClient.off(ENVIRONMENT_ALIAS_CHANGED_EVENT);
          pubsubSubscribed = false;
        }

        const hasOptedIntoAliases = spaceContext.hasOptedIntoAliases();
        if (!pubsubSubscribed && spaceId && hasOptedIntoAliases) {
          // listen for backend events
          pubsubSubscribed = true;
          pubsubClient = await createPubSubClientForSpace(spaceId);
          const environmentAliasChangedHandler = initEnvAliasChangeHandler(
            spaceContext.getEnvironmentId()
          );
          pubsubClient.on(ENVIRONMENT_ALIAS_CHANGED_EVENT, environmentAliasChangedHandler);
        }

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
          import('services/logger'),
          import('services/intercom'),
          import('data/CMA/ProductCatalog'),
          import('redux/store'),
          import('services/EnforcementsService'),
          import('navigation/NavState'),
          import('services/CreateSpace'),
          import('analytics/Analytics'),
          import('services/TokenStore')
        ]);

        refreshNavState = NavState.makeStateRefresher($state, spaceContext);

        $scope.showCreateSpaceDialog = CreateSpace.showDialog;
      }
    }
  ]);
}
