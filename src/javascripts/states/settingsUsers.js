import UserList from 'access_control/Users/UserList';

const list = {
  name: 'list',
  url: '',
  params: {
    jumpToRole: null
  },
  component: UserList
};

export default {
  name: 'users',
  url: '/users',
  abstract: true,
  children: [list]
};
