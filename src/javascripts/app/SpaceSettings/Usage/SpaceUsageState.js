import { Notification } from '@contentful/forma-36-react-components';

import { can } from 'access_control/AccessChecker';
import { getSpaceContext } from 'classes/spaceContext';
import { go } from 'states/Navigator';

import SpaceUsage from './SpaceUsage';

export default {
  name: 'usage',
  url: '/usage',
  template: '<react-component component="component" props="props"></react-component>',
  controller: [
    '$scope',
    ($scope) => {
      const spaceContext = getSpaceContext();
      const hasAccess = can('update', 'settings');
      const orgId = spaceContext.organization.sys.id;

      $scope.component = SpaceUsage;

      if (!hasAccess) {
        go({ path: 'spaces.detail' });
        Notification.warning(`You don't have permission to view the space usage.`, {
          cta: {
            label: 'Update your role',
            textLinkProps: {
              onClick: () =>
                go({
                  path: ['account', 'organizations', 'users', 'list'],
                  params: { orgId },
                  options: { reload: true },
                }),
            },
          },
        });
      } else {
        $scope.props = {
          spaceId: spaceContext.getId(),
          orgId,
          environmentMeta: spaceContext.space.environmentMeta,
        };
      }
    },
  ],
};
