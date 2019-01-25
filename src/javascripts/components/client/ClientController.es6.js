import { registerController } from 'NgRegistry.es6';
import { onValueScope } from 'utils/kefir.es6';
import { pick, isObject } from 'lodash';

registerController('ClientController', [
  '$scope',
  '$state',
  'features',
  'logger',
  'spaceContext',
  'authorization',
  'fontsDotCom',
  'intercom',
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
    features,
    logger,
    spaceContext,
    authorization,
    fontsDotCom,
    Intercom,
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
      showAuxPanel: false,
      toggleAuxPanel: function() {
        $scope.preferences.showAuxPanel = !$scope.preferences.showAuxPanel;
        $rootScope.$broadcast('show-aux-panel', $scope.preferences.showAuxPanel);
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
