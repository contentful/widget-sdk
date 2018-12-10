import { flow } from 'lodash/fp';

import { h } from 'utils/legacy-html-hyperscript';
import { onFeatureFlag } from 'utils/LaunchDarkly';
import usersState, { userDetailState } from './Users/UsersState.es6';
import userInvitationsState from './UserInvitations/UserInvitationsRoutingState.es6';
import organizationBase from './OrganizationSettingsBaseState.es6';

const newOrg = {
  name: 'new',
  url: '/new',
  label: 'Create new organization',
  views: {
    // Override organization navbar from the parent state
    'nav-bar@': { template: '' }
  },
  template: getIframeTemplate('Create new organization')
};

const edit = {
  name: 'edit',
  title: 'Organization information',
  url: '/:orgId/edit{pathSuffix:PathSuffix}'
};

const subscription = {
  name: 'subscription',
  title: 'Subscription',
  url: '/:orgId/z_subscription{pathSuffix:PathSuffix}'
};

const subscriptionBilling = {
  name: 'subscription_billing',
  title: 'Subscription',
  url: '/:orgId/subscription{pathSuffix:PathSuffix}',
  hideHeader: true
};

const spaces = {
  name: 'spaces',
  title: 'Organization spaces',
  url: '/:orgId/spaces{pathSuffix:PathSuffix}'
};

const offsitebackup = {
  name: 'offsitebackup',
  title: 'Offsite backup',
  url: '/:orgId/offsite_backup/edit{pathSuffix:PathSuffix}'
};

const billing = {
  name: 'billing',
  title: 'Billing',
  url: '/:orgId/z_billing{pathSuffix:PathSuffix}'
};

const userGatekeeper = {
  name: 'gatekeeper',
  title: 'Organization users',
  url: '/:orgId/organization_memberships/{pathSuffix:PathSuffix}'
};

function gatekeeperBase(definition) {
  const { featureFlag, title, hideHeader, reactComponentName } = definition;
  const defaults = {
    params: {
      pathSuffix: ''
    },
    controller: [
      '$scope',
      '$stateParams',
      function($scope, $stateParams) {
        featureFlag && setFeatureFlagInScope($scope, featureFlag);

        $scope.properties = {
          orgId: $stateParams.orgId,
          userId: $stateParams.userId,
          context: $scope.context,
          onReady: () => {
            $scope.context.ready = true;
            $scope.$applyAsync();
          }
        };
      }
    ],
    template: featureFlag
      ? getTemplateFromFeatureFlag(title, hideHeader, reactComponentName)
      : getIframeTemplate(title, hideHeader)
  };
  return Object.assign(defaults, definition);
}

// Sets a feature value that will be used on the selection of the template
// that can be a new react component or the old iframe view
function setFeatureFlagInScope($scope, featureFlag) {
  onFeatureFlag($scope, featureFlag, value => {
    $scope.useNewView = value;
  });
}

// Renders a template with a condition. If given feature flag is true,
// use the react component in `reactComponentName` or else use the
// iframe template
function getTemplateFromFeatureFlag(title, hideHeader, reactComponentName) {
  return [
    h('div', { ngIf: 'useNewView === false' }, getIframeTemplate(title, hideHeader)),
    h('react-component', {
      name: reactComponentName,
      props: 'properties',
      ngIf: 'useNewView'
    })
  ];
}

function getIframeTemplate(title, hideHeader) {
  return [
    hideHeader
      ? ''
      : h('.workbench-header__wrapper', [
          h('header.workbench-header', [h('h1.workbench-header__title', [title])])
        ]),
    h('cf-account-view', { context: 'context' })
  ];
}

export default [
  usersState,
  userDetailState,
  userInvitationsState,
  newOrg,
  spaces,
  offsitebackup,
  billing,
  edit,
  subscription,
  subscriptionBilling,
  userGatekeeper
].map(
  // wrap every route with gatekeeper/iframe specific settings
  flow(
    gatekeeperBase,
    organizationBase
  )
);
