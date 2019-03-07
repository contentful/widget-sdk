import {
  reactStateWrapper,
  organizationBase
} from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

export const inviteUsersState = organizationBase({
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

export const userDetailState = reactStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization user',
  url: '/:orgId/organization_memberships/:userId',
  componentPath: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6'
});

export const usersListState = reactStateWrapper({
  name: 'list',
  title: 'Organization users',
  url: '/:orgId/organization_memberships',
  componentPath: 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6'
});
