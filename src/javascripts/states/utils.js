import { get, find } from 'lodash';

import { getCurrentVariation } from 'utils/LaunchDarkly';
import { isLegacyOrganization } from 'utils/ResourceUtils';
import { getStore } from 'browserStorage';
import * as accessChecker from 'access_control/AccessChecker';
import * as TokenStore from 'services/TokenStore';
import AccountView from 'account/AccountView';

import Base from './Base';
import { go } from './Navigator';

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
    resolve: {
      useNewView: () => false
    },
    controller: getController(title, AccountView),
    template: '<react-component component="component" props="props"></react-component>'
  };

  return organizationBase(Object.assign(defaults, definition));
}

/**
 * Define a state for a new style React view
 * @param {string} definition.component React component
 */
export function reactStateWrapper(definition = {}) {
  const { component } = definition;
  const defaults = {
    controller: getController(definition.title, component),
    resolve: {
      useNewView: () => true
    },
    template: '<react-component component="component" props="props"></react-component>'
  };

  return organizationBase(Object.assign(defaults, definition));
}

/**
 * Define a state for a view that can be both iframe or react,
 * depending on the value of a feature flag.
 * This is used when migrating old iframe views to React
 *
 * @param {string} definition.featureFlag Feature flag key in LaunchDarkly
 * @param {string} definition.component  React component
 */
export function conditionalIframeWrapper(definition = {}) {
  const { title, component, featureFlag } = definition;

  const defaults = {
    controller: getController(title, component),
    resolve: {
      useNewView: () => (featureFlag ? getCurrentVariation(featureFlag) : false)
    },
    template: '<react-component component="component" props="props"></react-component>'
  };

  return organizationBase(Object.assign(defaults, definition));
}

function getController(title = '', component) {
  return [
    '$scope',
    '$stateParams',
    'useNewView',
    function($scope, $stateParams, useNewView) {
      $scope.component = useNewView === false ? AccountView : component;
      $scope.props = {
        ...$stateParams,
        title,
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

export function organizationBase(definition) {
  const defaults = {
    loadingText: 'Loading…',
    onEnter: [
      '$state',
      '$stateParams',
      async ($state, $stateParams) => {
        let orgId;
        let org;
        let space;
        if ($stateParams.orgId) {
          orgId = $stateParams.orgId;
        } else if ($stateParams.spaceId) {
          const spaces = await TokenStore.getSpaces();
          space = find(spaces, { sys: { id: $stateParams.spaceId } });
          orgId = get(space, 'organization.sys.id');
        }
        if (orgId) {
          org = await TokenStore.getOrganization(orgId);
        }

        const migration = migratedStates.find(state => $state.is(state.v1));
        if (space) {
          accessChecker.setSpace(space);
        } else if (org) {
          accessChecker.setOrganization(org);
        }
        store.set('lastUsedOrg', orgId);

        const isLegacy = org && isLegacyOrganization(org);

        if (isLegacy) {
          const shouldRedirectToV2 = !isLegacy && Boolean(migration);
          // redirect old v1 state to the new v2 state
          // in case a user from a previously v1 org has
          // the URL bookmarked
          if (shouldRedirectToV2) {
            go({
              path: migration.v2.split('.'),
              params: { orgId }
            });
          }
        }
      }
    ]
  };

  definition = Object.assign(defaults, definition);

  delete definition.featureFlag;
  delete definition.component;
  delete definition.title;

  return Base(definition);
}
