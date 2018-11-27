import Base from 'states/Base.es6';
import organizationBase from './OrganizationSettingsBaseState.es6';

import SubscriptionState from './Subscription/SubscriptionState.es6';
import UsageState from './Usage/UsageState.es6';
import teamsState from './Teams/TeamsState.es6';
import GatekeeperStates from './OrganizationSettingsGatekeeperStates.es6';

export function reactBase(definition) {
  const defaults = {
    controller: [
      '$stateParams',
      '$scope',
      ($stateParams, $scope) => {
        $scope.properties = {
          orgId: $stateParams.orgId,
          context: $scope.context
        };
      }
    ],
    template: `<${definition.componentName} properties="properties" />`
  };

  return organizationBase(Object.assign(defaults, definition));
}

export default Base({
  name: 'organizations',
  url: '/organizations',
  abstract: true,
  views: {
    'nav-bar@': {
      template: '<cf-organization-nav class="app-top-bar__child" />'
    }
  },
  children: [UsageState, reactBase(SubscriptionState), teamsState, ...GatekeeperStates]
});
