import { can } from 'access_control/AccessChecker';
import SpaceUsage from './SpaceUsage';
import { Notification } from '@contentful/forma-36-react-components';
import { go } from 'states/Navigator';
import { memberships } from 'app/OrganizationSettings/Subscription/links';

export default {
  name: 'usage',
  url: '/usage',
  template: '<react-component component="component" props="props"></react-component>',
  controller: [
    '$scope',
    'spaceContext',
    ($scope, spaceContext) => {
      const hasAccess = can('update', 'settings');
      const orgId = spaceContext.organization.sys.id;

      $scope.component = SpaceUsage;

      if (!hasAccess) {
        go({ path: 'spaces.detail' });
        Notification.warning(`You don't have permission to view the space usage.`, {
          cta: {
            label: 'Update your role',
            textLinkProps: { onClick: () => go(memberships(orgId)) },
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
