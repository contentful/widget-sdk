import base from 'states/Base.es6';

const list = base({
  name: 'list',
  url: '',
  label: 'Users',
  loadingText: 'Loading users…',
  template: '<cf-user-list class="workbench user-list" />'
});

export default {
  name: 'users',
  url: '/users',
  abstract: true,
  children: [list]
};
