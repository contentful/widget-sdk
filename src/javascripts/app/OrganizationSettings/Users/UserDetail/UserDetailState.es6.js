export default {
  name: 'users.detail',
  params: {
    userId: ''
  },
  title: 'Organization users',
  url: '/:userId',
  featureFlag: 'feature-bv-09-2018-new-org-membership-pages',
  reactComponentName: 'app/OrganizationSettings/Users/UserDetail/UserDetailRoute.es6'
};
