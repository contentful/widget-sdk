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
  const { title, icon, ...remainingDefinition } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    controller: getIframeController(title, icon, AccountView),
    template: '<react-component component="component" props="props"></react-component>'
  };

  return Base(organizationRoute(Object.assign(defaults, remainingDefinition)));
}

export function organizationRoute(definition) {
  const defaults = {
    onEnter: [
      '$stateParams',
      async $stateParams => {
        const { orgId: organizationId } = $stateParams;

        const organization = await TokenStore.getOrganization(organizationId);

        accessChecker.setOrganization(organization);

        store.set('lastUsedOrg', organizationId);
      }
    ]
  };

  return Object.assign(defaults, definition);
}

function getIframeController(title = '', icon = '', component) {
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
