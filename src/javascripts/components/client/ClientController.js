import { getSpaceContext } from 'classes/spaceContext';
import { registerController, appReady } from 'core/NgRegistry';
import { onValueScope } from 'core/utils/kefir';
import { isObject } from 'lodash';
import { setUser } from 'core/monitoring';
import { getSpaceFeature, SpaceFeatures } from 'data/CMA/ProductCatalog';
import * as EnforcementsService from 'services/EnforcementsService';
import * as TokenStore from 'services/TokenStore';
import authorization from 'services/authorization';
import {
  ENVIRONMENT_ALIAS_DELETED_EVENT,
  ENVIRONMENT_ALIAS_CHANGED_EVENT,
  ENVIRONMENT_ALIAS_CREATED_EVENT,
} from 'services/PubSubService';
import initEnvAliasChangeHandler, {
  initEnvAliasCreateHandler,
  initEnvAliasDeleteHandler,
} from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';
import { init as initOsano } from 'services/OsanoService';
import { openV1MigrationWarning } from 'features/news-slider';

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$rootScope',
    function ClientController($scope, $rootScope) {
      const spaceContext = getSpaceContext();

      let pubsubSubscribed;

      let pubSubClientRef;

      $scope.preferences = {
        showDisabledFields: false,
      };

      $scope.appReady = false;
      $scope.controllerReady = false;

      const unsubscribe = $rootScope.$on('$stateChangeSuccess', () => {
        openV1MigrationWarning();
        unsubscribe();
      });

      $scope.$watchCollection(
        () => ({
          tokenLookup: TokenStore.getTokenLookup(),
          space: spaceContext.space,
          enforcements: EnforcementsService.getEnforcements(spaceContext.getId()),
          environmentId: spaceContext.getEnvironmentId(),
        }),
        spaceAndTokenWatchHandler
      );

      // Wait for the app to be ready, via `appReady` from NgRegistry.
      //
      // See prelude.js and AngularInit.js.
      $scope.$watch(appReady, (ready) => {
        $scope.appReady = ready;
      });

      onValueScope($scope, TokenStore.user$, handleUser);

      $rootScope.$on('$locationChangeSuccess', function () {
        if (shouldCheckUsageForCurrentLocation()) {
          spaceAndTokenWatchHandler({
            tokenLookup: TokenStore.getTokenLookup(),
            space: spaceContext.space,
            enforcements: EnforcementsService.getEnforcements(spaceContext.getId()),
            environmentId: spaceContext.getEnvironmentId(),
          });
        }
      });

      $scope.controllerReady = true;

      async function spaceAndTokenWatchHandler({
        tokenLookup,
        space,
        enforcements,
        environmentId,
      }) {
        if (!tokenLookup) {
          return;
        }

        let newEnforcement = {};
        const spaceId = spaceContext.getId();

        if (shouldCheckUsageForCurrentLocation()) {
          const allowNewUsageCheck = await getSpaceFeature(
            spaceId,
            SpaceFeatures.ENVIRONMENT_USAGE_ENFORCEMENT,
            false
          );

          if (allowNewUsageCheck) {
            newEnforcement = await EnforcementsService.newUsageChecker(
              spaceContext.environmentResources
            );
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

        const pubsubClient = spaceContext.pubsubClient;

        if (pubSubClientRef && pubSubClientRef !== pubsubClient) {
          pubSubClientRef.off(ENVIRONMENT_ALIAS_CHANGED_EVENT);
          pubSubClientRef.off(ENVIRONMENT_ALIAS_CREATED_EVENT);
          pubSubClientRef.off(ENVIRONMENT_ALIAS_DELETED_EVENT);
          pubsubSubscribed = false;
        }

        pubSubClientRef = pubsubClient;

        if (pubsubClient && !pubsubSubscribed && spaceId) {
          pubsubSubscribed = true;

          pubsubClient.on(ENVIRONMENT_ALIAS_CHANGED_EVENT, (payload) => {
            const environmentAliasChangeHandler = initEnvAliasChangeHandler();
            return environmentAliasChangeHandler(payload);
          });

          pubsubClient.on(ENVIRONMENT_ALIAS_CREATED_EVENT, (payload) => {
            const environmentAliasCreatedHandler = initEnvAliasCreateHandler();
            return environmentAliasCreatedHandler(payload);
          });

          pubsubClient.on(ENVIRONMENT_ALIAS_DELETED_EVENT, (payload) => {
            const environmentAliasDeletedHandler = initEnvAliasDeleteHandler();
            return environmentAliasDeletedHandler(payload);
          });
        }
      }

      function handleUser(user) {
        if (!isObject(user)) {
          return;
        }

        $scope.user = user;

        initOsano();
        setUser(user);
      }

      // usage/limits enforcement should happen only
      // on pages specific to entities
      function shouldCheckUsageForCurrentLocation() {
        const relevantPages = ['content_types', 'entries', 'assets'];
        const splitPathName = window.location.pathname.replace(/\/+$/, '').split('/'); // strip trailing slashes
        const currentPage = splitPathName[splitPathName.length - 1];

        return relevantPages.includes(currentPage);
      }
    },
  ]);
}
