import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import Base from 'states/Base.es6';
import { getStore } from 'TheStore/index.es6';
import * as Analytics from 'analytics/Analytics.es6';
import { go } from 'states/Navigator.es6';

const store = getStore();

// A list of states that have been changed
// to be adapted to the new pricing model (V2).
// Orgs that are still in the old pricing model
// still access the V1 state
const migratedStates = [
  {
    v1: 'account.organizations.subscription',
    v2: 'account.organizations.subscription_new'
  }
];
/**
 * Define a state for an old GK iframe view
 */
export function iframeStateWrapper(definition = {}) {
  const { title } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    template: getIframeTemplate(title)
  };

  return organizationBase(Object.assign(defaults, definition));
}

/**
 * Define a state for a new style React view
 * @param {string} definition.componentPath Absolute path to the React component
 */
export function reactStateWrapper(definition = {}) {
  const { componentPath } = definition;
  const defaults = {
    controller: getController(),
    resolve: {
      useNewView: () => {}
    },
    template: getReactTemplate(componentPath)
  };

  return organizationBase(Object.assign(defaults, definition));
}

/**
 * Define a state for a view that can be both iframe or react,
 * depending on the value of a feature flag.
 * This is used when migrating old iframe views to React
 *
 * @param {string} definition.featureFlag Feature flag key in LaunchDarkly
 * @param {string} definition.componentPath Absolute path to the React component
 */
export function conditionalIframeWrapper(definition = {}) {
  const { title, componentPath, featureFlag } = definition;

  const defaults = {
    controller: getController(),
    resolve: {
      useNewView: () => (featureFlag ? getCurrentVariation(featureFlag) : false)
    },
    template: `
      <div>
        <div ng-if="useNewView === false">${getIframeTemplate(title)}</div>
        <div ng-if="useNewView === true">${getReactTemplate(componentPath)}</div>
      </div>
    `
  };

  return organizationBase(Object.assign(defaults, definition));
}

function getController() {
  return [
    '$scope',
    '$stateParams',
    'useNewView',
    function($scope, $stateParams, useNewView) {
      $scope.useNewView = useNewView;
      $scope.properties = {
        ...$stateParams,
        context: $scope.context,
        onReady: () => {
          $scope.context.ready = true;
          $scope.$applyAsync();
        },
        onForbidden: () => {
          $scope.context.forbidden = true;
          $scope.$applyAsync();
        }
      };
    }
  ];
}

function getReactTemplate(componentPath) {
  return `<react-component name="${componentPath}" props="properties" />`;
}

function getIframeTemplate(title) {
  return `
    <div>
      <div class="workbench-header__wrapper">
        <header class="workbench-header">
          <h1 class="workbench-header__title">${title}</h1>
        </header>
      </div>
      <cf-account-view context="context" />
    </div>
  `;
}

export function organizationBase(definition) {
  const defaults = {
    loadingText: 'Loading…',
    onEnter: [
      '$state',
      '$stateParams',
      'access_control/AccessChecker/index.es6',
      'services/TokenStore.es6',
      'utils/ResourceUtils.es6',
      async ($state, $stateParams, accessChecker, TokenStore, { useLegacy }) => {
        const org = await TokenStore.getOrganization($stateParams.orgId);

        Analytics.trackContextChange(null, org);

        const migration = migratedStates.find(state => $state.is(state.v1));
        accessChecker.setOrganization(org);
        store.set('lastUsedOrg', $stateParams.orgId);

        const isLegacy = await useLegacy(org);

        if (isLegacy) {
          const shouldRedirectToV2 = !isLegacy && Boolean(migration);
          // redirect old v1 state to the new v2 state
          // in case a user from a previously v1 org has
          // the URL bookmarked
          if (shouldRedirectToV2) {
            go({
              path: migration.v2.split('.'),
              params: { orgId: $stateParams.orgId }
            });
          }
        }
      }
    ]
  };

  definition = Object.assign(defaults, definition);

  delete definition.featureFlag;
  delete definition.componentPath;
  delete definition.title;

  return Base(definition);
}
