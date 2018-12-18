import {
  conditionalIframeWrapper,
  organizationBase
} from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export const inviteUsersState = organizationBase({
  label: 'Organizations & Billing',
  name: 'new',
  title: 'Invite new users',
  url: '/:orgId/invite',
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
  template: '<cf-new-organization-membership properties="properties" />'
});

export const userDetailState = conditionalIframeWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/:orgId/organization_memberships/:userId',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  componentPath: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6'
});

export const usersListState = conditionalIframeWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/:orgId/organization_memberships',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  componentPath: 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6'
});
