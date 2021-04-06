import SnapshotRedirect from './SnapshotRedirect';
import SnapshotComparator from './SnapshotRouteComponent';

const compareWithCurrent = {
  name: 'withCurrent',
  url: '/:snapshotId',
  params: { source: 'deepLink' },
  component: SnapshotComparator,
};

export default {
  name: 'compare',
  url: '/compare',
  children: [compareWithCurrent],
  component: SnapshotRedirect,
};
