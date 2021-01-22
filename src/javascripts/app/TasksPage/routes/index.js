import TasksPage from './..';
import TheLocaleStore from 'services/localeStore';
import { getSpaceContext } from 'classes/spaceContext';

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
        ({ spaceId }) => {
          const spaceContext = getSpaceContext();
          return {
            spaceId,
            environmentId: spaceContext.getEnvironmentId(),
            currentUserId: spaceContext.getData('spaceMember.sys.user.sys.id'),
            isMasterEnvironmentById: (environmentId) =>
              spaceContext.isMasterEnvironmentById(environmentId),
            users: spaceContext.users,
            defaultLocaleCode: TheLocaleStore.getDefaultLocale().code,
            getContentType: (contentTypeId) => spaceContext.publishedCTs.get(contentTypeId),
          };
        },
      ],
    },
  ],
};
