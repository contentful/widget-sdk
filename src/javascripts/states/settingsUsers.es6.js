import { registerFactory } from 'NgRegistry.es6';
import base from 'states/Base.es6';

/**
 * @ngdoc service
 * @name states/settings/users
 */
registerFactory('states/settings/users', () => {
  const list = base({
    name: 'list',
    url: '',
    label: 'Users',
    loadingText: 'Loading users…',
    template: '<cf-user-list class="workbench user-list" />'
  });

  return {
    name: 'users',
    url: '/users',
    abstract: true,
    children: [list]
  };
});
