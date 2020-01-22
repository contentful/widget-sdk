import { reactStateWrapper } from './utils';
import UserList from 'access_control/Users/UserList';

const list = reactStateWrapper({
  name: 'list',
  title: 'Space users',
  loadingText: 'Loading users…',
  url: '',
  params: {
    jumpToRole: null
  },
  component: UserList
});

export default {
  name: 'users',
  url: '/users',
  abstract: true,
  children: [list]
};
