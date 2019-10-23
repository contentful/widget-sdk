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
          currentUser: spaceContext.getCurrentUser,
          currentUserId: spaceContext.getData('spaceMember.sys.user.sys.id'),
          users: spaceContext.users,
          defaultLocale: TheLocaleStore.getDefaultLocale(),
          getEntries: query => spaceContext.cma.getEntries(query),
          getEntryTitle: entry => spaceContext.entryTitle(entry)
        })
      ]
    }
  ]
};
