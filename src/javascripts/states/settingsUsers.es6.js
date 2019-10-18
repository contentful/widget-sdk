import { reactStateWrapper } from './utils.es6';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space users',
  loadingText: 'Loading users…',
  url: '',
  params: {
    jumpToRole: null
  },
  componentPath: 'access_control/Users/UserList'
});

export default {
  name: 'users',
  url: '/users',
  abstract: true,
  children: [list]
};
