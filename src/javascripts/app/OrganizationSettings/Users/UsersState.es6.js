import organizationBase from 'app/OrganizationSettings/OrganizationSettingsBaseState.es6';
import NewUserState from './NewUser/NewUserState.es6';

export { default as userDetailState } from './UserDetail/UserDetailState.es6';

export default {
  name: 'users',
  children: [organizationBase(NewUserState)],
  url: '/:orgId/organization_memberships',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  reactComponentName: 'app/OrganizationSettings/Users/UsersList/UserListRoute.es6'
};
