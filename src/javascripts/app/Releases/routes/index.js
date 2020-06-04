import TheLocaleStore from 'services/localeStore';
import ReleasesListRoute from './ReleasesListRoute';
import ReleaseDetailRoute from './ReleaseDetailRoute';

const detail = {
  name: 'detail',
  url: '/:releaseId',
  component: ReleaseDetailRoute,
  params: {
    addToContext: true,
    releaseId: '',
  },
  mapInjectedToProps: [
    '$stateParams',
    'spaceContext',
    ({ releaseId }) => ({
      releaseId,
      defaultLocale: TheLocaleStore.getDefaultLocale(),
    }),
  ],
};

export default {
  name: 'releases',
  url: '/releases',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: ReleasesListRoute,
    },
    detail,
  ],
};
