import * as TokenStore from 'services/TokenStore';
import * as accessChecker from 'access_control/AccessChecker';
import { getStore } from 'browserStorage';

import AccountView from 'account/AccountView';

import Base from './Base';

const store = getStore();

/**
 * Define a state for an old GK iframe view
 */
export function iframeStateWrapper(definition = {}) {
  const { title, icon } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    controller: getController(title, icon, AccountView),
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
    controller: getController(definition.title, definition.icon, component),
    template: '<react-component component="component" props="props"></react-component>'
  };

  return organizationBase(Object.assign(defaults, definition));
}

function getController(title = '', icon = '', component) {
  return [
    '$scope',
    '$stateParams',
    function($scope, $stateParams) {
      $scope.component = component;
      $scope.props = {
        ...$stateParams,
        title,
        icon,
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
      '$stateParams',
      async $stateParams => {
        // This function is currently being used in non-org routes since it's used for all `reactStateWrapper` usages,
        // so we have to have this check
        if ($stateParams.orgId) {
          const { orgId: organizationId } = $stateParams;

          const organization = await TokenStore.getOrganization(organizationId);

          accessChecker.setOrganization(organization);

          store.set('lastUsedOrg', organizationId);
        }
      }
    ]
  };

  definition = Object.assign(defaults, definition);

  delete definition.featureFlag;
  delete definition.component;
  delete definition.title;
  delete definition.icon;

  return Base(definition);
}
