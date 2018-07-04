import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import classnames from 'classnames';
import { get } from 'lodash';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';

import UpgradeLink from './UpgradeLink';

import * as actionCreators from './store/actionCreators';

class RecordsResourceUsage extends React.Component {
  static propTypes = {
    space: PropTypes.object.isRequired,
    getIncentivizingFlag: PropTypes.func.isRequired,
    getResource: PropTypes.func.isRequired,
    incentivizeUpgradeEnabled: PropTypes.bool.isRequired,
    resources: PropTypes.object.isRequired
  }

  componentDidMount () {
    const { getIncentivizingFlag, getResource, space } = this.props;

    getIncentivizingFlag();
    getResource({ spaceId: space.sys.id, resourceName: 'record' });
  }

  upgradeSpace () {
    const { space } = this.props;
    const { resource } = this.state;

    showUpgradeSpaceDialog({
      organizationId: space.organization.sys.id,
      space: space,
      limitReached: resource,
      action: 'change',
      onSubmit: this.updateUsage
    });
  }

  render () {
    const { incentivizeUpgradeEnabled, resources, space } = this.props;
    const spaceId = space.sys.id;

    const resourceMeta = get(resources, `${spaceId}.record`);

    if (!resourceMeta || resourceMeta.isPending) {
      return null;
    }

    const resource = resourceMeta.resource;

    const usage = get(resource, 'usage');
    const limit = get(resource, 'limits.maximum');

    const warnThreshold = 0.9;
    const errorThreshold = 0.95;

    const usagePercentage = usage / limit;
    const atLimit = usagePercentage >= 1;

    return (
      <div className={classnames(
        'usage',
        {
          'usage--warn': usage / limit >= warnThreshold && usage / limit < errorThreshold,
          'usage--danger': usage / limit >= errorThreshold
        }
      )}>
        {
          atLimit &&
          <span>You&apos;ve reached the limit of {limit} entries and assets.&#32;</span>
        }
        {
          !atLimit &&
          <span>Usage: {usage} / {limit} entries and assets&#32;</span>
        }
        {
          usagePercentage >= warnThreshold &&
          <UpgradeLink
            incentivizeUpgradeEnabled={incentivizeUpgradeEnabled}
            upgradeSpace={this.upgradeSpace.bind(this)}
          />
        }
      </div>
    );
  }
}

const mapStateToProps = state => {
  return {
    resources: state.recordsResourceUsage.resources,
    incentivizeUpgradeEnabled: state.recordsResourceUsage.incentivizeUpgradeEnabled
  };
};

const mapDispatchToProps = {
  getIncentivizingFlag: actionCreators.getIncentivizingFlag,
  getResource: actionCreators.getResource
};

export default connect(mapStateToProps, mapDispatchToProps)(RecordsResourceUsage);
