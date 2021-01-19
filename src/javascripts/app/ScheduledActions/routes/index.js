import ScheduledActionsListRoute from './ScheduledActionsListRoute';

export default {
  name: 'jobs',
  url: '/jobs',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',

      component: ScheduledActionsListRoute,
    },
  ],
};
