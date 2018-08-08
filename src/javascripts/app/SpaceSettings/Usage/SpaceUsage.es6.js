import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import * as ReloadNotification from 'ReloadNotification';
import createResourceService from 'services/ResourceService';
import {update, add, keyBy, flow, filter} from 'lodash/fp';

import Workbench from 'app/WorkbenchReact';
import ResourceUsageList from './ResourceUsageList';
import SpaceUsageSidebar from './SpaceUsageSidebar';

const SpaceUsage = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    spaceId: PropTypes.string.isRequired
  },
  getInitialState () {
    return {
      resources: undefined
    };
  },
  componentDidMount () {
    this.fetchPlan();
  },

  async fetchPlan () {
    const {spaceId} = this.props;
    const service = createResourceService(spaceId);
    const isPermanent = resource => resource.kind === 'permanent';

    try {
      this.setState({
        resources:
          flow(
            filter(isPermanent),
            keyBy('sys.id'),
            update('environment', flow(
              update('limits', flow(
                update('included', add(1)),
                update('maximum', add(1))
              )),
              update('usage', add(1))
            ))
          )(
            await service.getAll()
          )
      });
    } catch (e) {
      ReloadNotification.apiErrorHandler(e);
    }
  },

  render () {
    const {resources} = this.state;
    return (
      <Workbench
        title="Space usage"
        icon="page-usage"
        testId="space.usage"
        content={<ResourceUsageList resources={resources} />}
        sidebar={<SpaceUsageSidebar resources={resources} />}
      />
    );
  }
});

export default SpaceUsage;
