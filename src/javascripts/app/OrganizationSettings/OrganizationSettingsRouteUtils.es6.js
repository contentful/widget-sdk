import { onFeatureFlag } from 'utils/LaunchDarkly';
import Base from 'states/Base.es6';
import { getStore } from 'TheStore';
import * as Analytics from 'analytics/Analytics.es6';

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
    controller: getController(definition),
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
export function conditionalStateWrapper(definition = {}) {
  const { title, componentPath } = definition;

  const defaults = {
    controller: getController(definition),
    template: `
      <div>
        <div ng-if="useNewView === false">${getIframeTemplate(title)}</div>
        <div ng-if="useNewView">${getReactTemplate(componentPath)}</div>
      </div>
    `
  };

  return organizationBase(Object.assign(defaults, definition));
}

function getController(definitions) {
  const { featureFlag } = definitions;
  return [
    '$scope',
    '$stateParams',
    function($scope, $stateParams) {
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

      featureFlag &&
        onFeatureFlag($scope, featureFlag, value => {
          $scope.useNewView = value;
        });
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

function organizationBase(definition) {
  const defaults = {
    label: 'Organizations & Billing',
    onEnter: [
      '$state',
      '$stateParams',
      'require',
      async ($state, $stateParams, require) => {
        const accessChecker = require('access_control/AccessChecker');
        const useLegacy = require('utils/ResourceUtils.es6').useLegacy;
        const TokenStore = require('services/TokenStore.es6');
        const go = require('states/Navigator.es6').go;

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
  return Base(Object.assign(defaults, definition));
}
