import * as React from 'react';
import { css } from 'emotion';
import { Notification } from '@contentful/forma-36-react-components';
import ReloadNotification from 'app/common/ReloadNotification';
import createResourceService from 'services/ResourceService';
import { createSpaceEndpoint } from 'data/EndpointFactory';
import { update, add, keyBy, flow, filter } from 'lodash/fp';
import { Workbench } from '@contentful/forma-36-react-components';
import ResourceUsageList from './ResourceUsageList';
import SpaceUsageSidebar from './SpaceUsageSidebar';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { FLAGS, useFeatureFlag } from 'core/feature-flags';
import { getSpaceEntitlementSet } from './services/EntitlementService';
import { can } from 'access_control/AccessChecker';
import { go } from 'states/Navigator';
import { useSpaceEnvContext } from 'core/services/SpaceEnvContext/useSpaceEnvContext';
import { getEnvironmentMeta } from 'core/services/SpaceEnvContext/utils';
import { router } from 'core/react-routing';

const addMasterEnvironment = flow(
  update('limits', flow(update('included', add(1)), update('maximum', add(1)))),
  update('usage', add(1))
);

const styles = {
  sidebar: css({
    position: 'relative',
  }),
};

export default function SpaceUsage() {
  const { currentSpaceId, currentSpace, currentOrganizationId, resources } = useSpaceEnvContext();
  const environmentMeta = getEnvironmentMeta(currentSpace);
  const [spaceResources, setSpaceResources] = React.useState();
  const [environmentResources, setEnvironmentResources] = React.useState();
  const [entitlementsAPIEnabled] = useFeatureFlag(FLAGS.ENTITLEMENTS_API);
  const [entitlementsSet, setEntitlementsSet] = React.useState();

  React.useEffect(() => {
    if (!currentSpaceId || !entitlementsAPIEnabled) {
      return;
    }

    getSpaceEntitlementSet(currentSpaceId)
      .then(setEntitlementsSet)
      .catch(() => {});
  }, [currentSpaceId, entitlementsAPIEnabled]);

  React.useEffect(() => {
    if (!currentOrganizationId) {
      return;
    }

    const hasAccess = can('update', 'settings');
    if (!hasAccess) {
      go({ path: 'spaces.detail' });

      Notification.warning(`You don't have permission to view the space usage.`, {
        cta: {
          label: 'Update your role',
          textLinkProps: {
            onClick: () =>
              router.navigate(
                { path: 'organizations.users.list', orgId: currentOrganizationId },
                { reload: true }
              ),
          },
        },
      });
    }
  }, [currentOrganizationId]);

  React.useEffect(() => {
    async function fetchPlan() {
      const spaceEndpoint = createSpaceEndpoint(currentSpaceId);
      const spaceResourceService = createResourceService(spaceEndpoint);
      try {
        const [spaceServiceResult, envServiceResult] = await Promise.all([
          spaceResourceService.getAll(),
          resources.getAll(),
        ]);

        const isPermanent = (resource) => resource.kind === 'permanent';
        const spaceResources = flow(
          filter(isPermanent),
          keyBy('sys.id'),
          update('environment', addMasterEnvironment)
        )(spaceServiceResult);
        setSpaceResources(spaceResources);

        const environmentResources = flow(keyBy('sys.id'))(envServiceResult);
        setEnvironmentResources(environmentResources);
      } catch (e) {
        ReloadNotification.apiErrorHandler(e);
      }
    }

    fetchPlan();
  }, [currentSpaceId, resources]);

  return (
    <React.Fragment>
      <DocumentTitle title="Usage" />
      <Workbench>
        <Workbench.Header icon={<ProductIcon icon="Usage" size="large" />} title="Space usage" />
        <Workbench.Content>
          <ResourceUsageList
            spaceResources={spaceResources}
            environmentResources={environmentResources}
            environmentMeta={environmentMeta}
            entitlementsSet={entitlementsAPIEnabled ? entitlementsSet : undefined}
          />
        </Workbench.Content>
        <Workbench.Sidebar position="right" className={styles.sidebar}>
          <SpaceUsageSidebar
            spaceResources={spaceResources}
            environmentResources={environmentResources}
            environmentId={environmentMeta.environmentId}
          />
        </Workbench.Sidebar>
      </Workbench>
    </React.Fragment>
  );
}
