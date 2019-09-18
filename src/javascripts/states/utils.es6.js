import { get, find } from 'lodash';

import { getCurrentVariation } from 'utils/LaunchDarkly/index.es6';
import { isLegacyOrganization } from 'utils/ResourceUtils.es6';
import { getStore } from 'TheStore/index.es6';
import * as accessChecker from 'access_control/AccessChecker/index.es6';
import * as TokenStore from 'services/TokenStore.es6';

import Base from './Base.es6';
import { go } from './Navigator.es6';

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

const iframeTemplate = getReactTemplate('account/AccountView.es6');

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
      useNewView: () => {}
    },
    controller: getController(title),
    template: iframeTemplate
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
    controller: getController(title),
    resolve: {
      useNewView: () => (featureFlag ? getCurrentVariation(featureFlag) : false)
    },
    template: `
      <div>
        <div ng-if="useNewView === false">${iframeTemplate}</div>
        <div ng-if="useNewView === true">${getReactTemplate(componentPath)}</div>
      </div>
    `
  };

  return organizationBase(Object.assign(defaults, definition));
}

function getController(title) {
  return [
    '$scope',
    '$stateParams',
    'useNewView',
    function($scope, $stateParams, useNewView) {
      $scope.useNewView = useNewView;
      $scope.properties = {
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

function getReactTemplate(componentPath) {
  return `<react-component name="${componentPath}" props="properties" />`;
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
  delete definition.componentPath;
  delete definition.title;

  return Base(definition);
}
