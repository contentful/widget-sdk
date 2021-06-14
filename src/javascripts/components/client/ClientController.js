import { getSpaceContext } from 'classes/spaceContext';
import { registerController, appReady } from 'core/NgRegistry';
import { onValueScope } from 'core/utils/kefir';
import { isObject } from 'lodash';
import { setUser } from 'core/monitoring';

// Do not add imports here, or else it may affect Karma tests. You need to import
// everything using the async method below. See `initialize`.

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$state',
    '$rootScope',
    function ClientController($scope, $state, $rootScope) {
      const spaceContext = getSpaceContext();
      let SpaceFeatures;
      let getSpaceFeature;
      let EnforcementsService;
      let NavState;
      let CreateSpace;
      let TokenStore;
      let refreshNavState;
      let pubsubSubscribed;
      let authorization;
      let EntityFieldValueSpaceContext;
      let ENVIRONMENT_ALIAS_CHANGED_EVENT;
      let ENVIRONMENT_ALIAS_CREATED_EVENT;
      let ENVIRONMENT_ALIAS_DELETED_EVENT;
      let initEnvAliasChangeHandler;
      let initEnvAliasCreateHandler;
      let initEnvAliasDeleteHandler;
      let initOsano;
      let openV1MigrationWarning;
      let pubSubClientRef;

      $scope.preferences = {
        showDisabledFields: false,
      };

      $scope.appReady = false;
      $scope.controllerReady = false;

      initialize().then(() => {
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
      });

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
            newEnforcement = await EnforcementsService.newUsageChecker(spaceContext.resources);
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
        refreshNavState();
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

      async function initialize() {
        [
          { getSpaceFeature, SpaceFeatures },
          EnforcementsService,
          NavState,
          CreateSpace,
          TokenStore,
          { default: authorization },
          EntityFieldValueSpaceContext,
          {
            ENVIRONMENT_ALIAS_CHANGED_EVENT,
            ENVIRONMENT_ALIAS_CREATED_EVENT,
            ENVIRONMENT_ALIAS_DELETED_EVENT,
          },
          {
            default: initEnvAliasChangeHandler,
            initEnvAliasCreateHandler,
            initEnvAliasDeleteHandler,
          },
          { init: initOsano },
          { openV1MigrationWarning },
        ] = await Promise.all([
          import(/* webpackMode: "eager" */ 'data/CMA/ProductCatalog'),
          import(/* webpackMode: "eager" */ 'services/EnforcementsService'),
          import(/* webpackMode: "eager" */ 'navigation/NavState'),
          import(/* webpackMode: "eager" */ 'services/CreateSpace'),
          import(/* webpackMode: "eager" */ 'services/TokenStore'),
          import(/* webpackMode: "eager" */ 'services/authorization'),
          import(/* webpackMode: "eager" */ 'classes/EntityFieldValueSpaceContext'),
          import(/* webpackMode: "eager" */ 'services/PubSubService'),
          import(
            /* webpackMode: "eager" */ 'app/SpaceSettings/EnvironmentAliases/NotificationsService'
          ),
          import(/* webpackMode: "eager" */ 'services/OsanoService'),
          import(/* webpackMode: "eager" */ 'features/news-slider'),
        ]);

        refreshNavState = NavState.makeStateRefresher($state, spaceContext);

        $scope.showCreateSpaceDialog = CreateSpace.showDialog;
        $scope.EntityFieldValueSpaceContext = EntityFieldValueSpaceContext;
      }
    },
  ]);
}
