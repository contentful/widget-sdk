import TasksPage from './../index.es6';
import TheLocaleStore from 'services/localeStore.es6';

export default {
  name: 'tasks',
  url: '/tasks',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',

      component: TasksPage,
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
