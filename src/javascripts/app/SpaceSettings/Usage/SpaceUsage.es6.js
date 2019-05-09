import React from 'react';
import PropTypes from 'prop-types';
import ReloadNotification from 'app/common/ReloadNotification.es6';
import createResourceService from 'services/ResourceService.es6';
import { update, add, keyBy, flow, filter } from 'lodash/fp';
import Workbench from 'app/common/Workbench.es6';
import ResourceUsageList from './ResourceUsageList.es6';
import SpaceUsageSidebar from './SpaceUsageSidebar.es6';
import DocumentTitle from 'components/shared/DocumentTitle.es6';

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

class SpaceUsage extends React.Component {
  static propTypes = {
    orgId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired,
    environmentId: PropTypes.string //TODO make this required
  };

  state = {
    spaceResources: undefined,
    envResources: undefined
  };

  componentDidMount() {
    this.fetchPlan();
  }

  fetchPlan = async () => {
    const { spaceId, environmentId } = this.props;
    const spaceScopedService = createResourceService(spaceId);
    const envScopedService = createResourceService(spaceId, 'space', environmentId);
    const isPermanent = resource => resource.kind === 'permanent';

    try {
      this.setState({
        spaceResources: flow(
          filter(isPermanent),
          keyBy('sys.id'),
          update('environment', addMasterEnvironment)
        )(await spaceScopedService.getAll()),
        envResources: flow(keyBy('sys.id'))(await envScopedService.getAll())
      });
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  };

  render() {
    const { spaceResources, envResources } = this.state;
    return (
      <React.Fragment>
        <DocumentTitle title="Usage" />
        <Workbench>
          <Workbench.Header>
            <Workbench.Icon icon="page-usage" />
            <Workbench.Title>Space usage</Workbench.Title>
          </Workbench.Header>
          <Workbench.Content>
            <ResourceUsageList
              spaceResources={spaceResources}
              envResources={envResources}
              environment={this.props.environmentId}
            />
          </Workbench.Content>
          <Workbench.Sidebar>
            <SpaceUsageSidebar
              spaceResources={spaceResources}
              envResources={envResources}
              environmentId={this.props.environmentId}
            />
          </Workbench.Sidebar>
        </Workbench>
      </React.Fragment>
    );
  }
}

export default SpaceUsage;
