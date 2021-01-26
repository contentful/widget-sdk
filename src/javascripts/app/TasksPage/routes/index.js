import RouteComponent from './TasksPageRouteComponent';

export default {
  name: 'tasks',
  url: '/tasks',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: RouteComponent,
    },
  ],
};
