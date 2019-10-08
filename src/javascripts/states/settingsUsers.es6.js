const list = {
  name: 'list',
  url: '',
  template: '<cf-user-list class="workbench user-list" />'
};

export default {
  name: 'users',
  url: '/users',
  abstract: true,
  children: [list]
};
