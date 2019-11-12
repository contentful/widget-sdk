import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import ReloadNotification from 'app/common/ReloadNotification';
import createResourceService from 'services/ResourceService';
import { update, add, keyBy, flow, filter } from 'lodash/fp';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import ResourceUsageList from './ResourceUsageList';
import SpaceUsageSidebar from './SpaceUsageSidebar';
import DocumentTitle from 'components/shared/DocumentTitle';
import Icon from 'ui/Components/Icon';

const addMasterEnvironment = flow(
  update(
    'limits',
    flow(
      update('included', add(1)),
      update('maximum', add(1))
    )
  ),
  update('usage', add(1))
);

const styles = {
  sidebar: css({
    position: 'relative'
  })
};

class SpaceUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired,
    environmentMeta: PropTypes.shape({
      aliasId: PropTypes.string,
      environmentId: PropTypes.string.isRequired,
      isMasterEnvironment: PropTypes.bool.isRequired
    }).isRequired
  };

  state = {
    spaceResources: undefined,
    environmentResources: undefined
  };

  componentDidMount() {
    this.fetchPlan();
  }

  fetchPlan = async () => {
    const { spaceId, environmentMeta } = this.props;
    const spaceScopedService = createResourceService(spaceId);
    const envScopedService = createResourceService(spaceId, 'space', environmentMeta.environmentId);
    const isPermanent = resource => resource.kind === 'permanent';

    try {
      this.setState({
        spaceResources: flow(
          filter(isPermanent),
          keyBy('sys.id'),
          update('environment', addMasterEnvironment)
        )(await spaceScopedService.getAll()),
        environmentResources: flow(keyBy('sys.id'))(await envScopedService.getAll())
      });
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  };

  render() {
    const { spaceResources, environmentResources } = this.state;
    const { environmentMeta } = this.props;
    return (
      <React.Fragment>
        <DocumentTitle title="Usage" />
        <Workbench>
          <Workbench.Header icon={<Icon name="page-usage" />} title="Space usage" />
          <Workbench.Content>
            <ResourceUsageList
              spaceResources={spaceResources}
              environmentResources={environmentResources}
              environmentMeta={environmentMeta}
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
