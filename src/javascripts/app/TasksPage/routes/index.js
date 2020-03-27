import TasksPage from './..';
import TheLocaleStore from 'services/localeStore';

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
          currentUserId: spaceContext.getData('spaceMember.sys.user.sys.id'),
          users: spaceContext.users,
          defaultLocaleCode: TheLocaleStore.getDefaultLocale().code,
          getContentType: (contentTypeId) => spaceContext.publishedCTs.get(contentTypeId),
        }),
      ],
    },
  ],
};
