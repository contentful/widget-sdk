import { ReleasesListRoute } from '../releases-list';
import { ReleaseDetailsRoute } from '../release-details';

const releaseDetails = {
  name: 'detail',
  url: '/:releaseId',
  component: ReleaseDetailsRoute,
  params: {
    addToContext: true,
    releaseId: '',
  },
};

const routes = {
  name: 'releases',
  url: '/releases',
  abstract: true,
  children: [
    {
      name: 'list',
      url: '',
      component: ReleasesListRoute,
    },
    releaseDetails,
  ],
};

export { routes };
