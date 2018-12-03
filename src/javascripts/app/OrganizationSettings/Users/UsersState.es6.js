import { conditionalStateWrapper } from 'app/OrganizationSettings/OrganizationSettingsRouteUtils.es6';

const newUser = {
  label: 'Organizations & Billing',
  name: 'new',
  title: 'Organization users',
  url: '/new',
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
};

const userDetail = conditionalStateWrapper({
  name: 'detail',
  params: {
    userId: ''
  },
  title: 'Organization users',
  url: '/:userId',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  componentPath: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6'
});

export default conditionalStateWrapper({
  name: 'users',
  children: [newUser, userDetail],
  title: 'Organization users',
  url: '/:orgId/organization_memberships',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  componentPath: 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6'
});
