import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import ReloadNotification from 'app/common/ReloadNotification';
import createResourceService from 'services/ResourceService';
import { update, add, keyBy, flow, filter } from 'lodash/fp';
import { Workbench } from '@contentful/forma-36-react-components';
import ResourceUsageList from './ResourceUsageList';
import SpaceUsageSidebar from './SpaceUsageSidebar';
import DocumentTitle from 'components/shared/DocumentTitle';
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { getSpaceEntitlementSet } from './services/EntitlementService';

const addMasterEnvironment = flow(
  update('limits', flow(update('included', add(1)), update('maximum', add(1)))),
  update('usage', add(1))
);

const styles = {
  sidebar: css({
    position: 'relative',
  }),
};

class SpaceUsage extends React.Component {
  static propTypes = {
    spaceId: PropTypes.string.isRequired,
    environmentMeta: PropTypes.shape({
      aliasId: PropTypes.string,
      environmentId: PropTypes.string.isRequired,
      isMasterEnvironment: PropTypes.bool.isRequired,
    }).isRequired,
  };

  state = {
    spaceResources: undefined,
    environmentResources: undefined,
    entitlementsAPIEnabled: false,
    entitlementsSet: undefined,
  };

  async componentDidMount() {
    const entitlementsAPIEnabled = await getVariation(FLAGS.ENTITLEMENTS_API);

    this.setState({
      entitlementsAPIEnabled,
    });
    this.fetchPlan();
  }

  fetchPlan = async () => {
    const { spaceId, environmentMeta } = this.props;
    const spaceScopedService = createResourceService(spaceId);
    const envScopedService = createResourceService(spaceId, 'space', environmentMeta.environmentId);
    const isPermanent = (resource) => resource.kind === 'permanent';

    if (this.state.entitlementsAPIEnabled) {
      try {
        const entitlementsSet = await getSpaceEntitlementSet(spaceId);
        this.setState({
          entitlementsSet,
        });
      } catch {
        //
      }
    }

    try {
      this.setState({
        spaceResources: flow(
          filter(isPermanent),
          keyBy('sys.id'),
          update('environment', addMasterEnvironment)
        )(await spaceScopedService.getAll()),
        environmentResources: flow(keyBy('sys.id'))(await envScopedService.getAll()),
      });
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  };

  render() {
    const {
      spaceResources,
      environmentResources,
      entitlementsAPIEnabled,
      entitlementsSet,
    } = this.state;
    const { environmentMeta } = this.props;
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
}

export default SpaceUsage;
