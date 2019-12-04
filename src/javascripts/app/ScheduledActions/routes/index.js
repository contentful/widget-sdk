import ScheduledActionsListRoute from './ScheduledActionsListRoute';
import TheLocaleStore from 'services/localeStore';

export default {
  name: 'jobs',
  url: '/jobs',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',

      component: ScheduledActionsListRoute,
      mapInjectedToProps: [
        '$stateParams',
        'spaceContext',
        ({ spaceId }, spaceContext) => ({
          spaceId,
          environmentId: spaceContext.getEnvironmentId(),
          defaultLocale: TheLocaleStore.getDefaultLocale(),
          contentTypes: spaceContext.publishedCTs.getAllBare()
        })
      ]
    }
  ]
};
