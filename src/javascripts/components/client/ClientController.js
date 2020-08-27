import { registerController, appReady } from 'core/NgRegistry';
import { onValueScope } from 'core/utils/kefir';
import { pick, isObject } from 'lodash';

// Do not add imports here, or else it may affect Karma tests. You need to import
// everything using the async method below. See `initialize`.

export default function register() {
  registerController('ClientController', [
    '$scope',
    '$state',
    'spaceContext',
    '$rootScope',
    function ClientController($scope, $state, spaceContext, $rootScope) {
      let logger;
      let FEATURES;
      let getSpaceFeature;
      let store;
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
      let openPricing2020Warning;
      let pubSubClientRef;

      // TODO remove this eventually. All components should access it as a service

      $scope.spaceContext = spaceContext;
      // end TODO

      $scope.preferences = {
        showDisabledFields: false,
      };

      $scope.appReady = false;
      $scope.controllerReady = false;

      initialize().then(() => {
        // We do this once
        store.dispatch({
          type: 'LOCATION_CHANGED',
          payload: { location: pickSerializable(window.location) },
        });

        const unsubscribe = $rootScope.$on('$stateChangeSuccess', () => {
          openPricing2020Warning();
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
          store.dispatch({
            type: 'LOCATION_CHANGED',
            payload: { location: pickSerializable(window.location) },
          });

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
          'search',
        ]);
      }

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
            FEATURES.ENVIRONMENT_USAGE_ENFORCEMENT,
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

        logger.enable(user);
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
          logger,
          { getSpaceFeature, FEATURES },
          { default: store },
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
          { openPricing2020Warning },
        ] = await Promise.all([
          import(/* webpackMode: "eager" */ 'services/logger'),
          import(/* webpackMode: "eager" */ 'data/CMA/ProductCatalog'),
          import(/* webpackMode: "eager" */ 'redux/store'),
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
