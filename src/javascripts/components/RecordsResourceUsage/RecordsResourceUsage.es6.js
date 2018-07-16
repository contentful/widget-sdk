import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';

import classnames from 'classnames';
import { get } from 'lodash';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { getStoreResource } from 'utils/ResourceUtils';

import { TextLink } from '@contentful/ui-component-library';

import * as actionCreators from './store/actionCreators';

export class RecordsResourceUsage extends React.Component {
  static propTypes = {
    space: PropTypes.object.isRequired,
    currentTotal: PropTypes.number.isRequired,
    getIncentivizingFlag: PropTypes.func.isRequired,
    getResource: PropTypes.func.isRequired,
    incentivizeUpgradeEnabled: PropTypes.bool.isRequired,
    resources: PropTypes.object.isRequired
  }

  componentDidUpdate (prevProps) {
    const { currentTotal: previousTotal } = prevProps;
    const { getResource, space, currentTotal } = this.props;

    if (previousTotal !== currentTotal) {
      getResource({ spaceId: space.sys.id, resourceName: 'record' });
    }
  }

  componentDidMount () {
    const { getIncentivizingFlag, getResource, space } = this.props;

    getIncentivizingFlag();
    getResource({ spaceId: space.sys.id, resourceName: 'record' });
  }

  resource () {
    const { resources, space } = this.props;
    const spaceId = space.sys.id;

    const resourceMeta = getStoreResource(resources, spaceId, 'record');

    if (!resourceMeta || resourceMeta.isPending) {
      return null;
    }

    return resourceMeta.value;
  }

  upgradeSpace () {
    const { space } = this.props;
    const resource = this.resource();

    showUpgradeSpaceDialog({
      organizationId: space.organization.sys.id,
      space: space,
      limitReached: resource,
      action: 'change',
      onSubmit: this.updateUsage
    });
  }

  render () {
    const { incentivizeUpgradeEnabled } = this.props;

    // Explicitly don't show this until the feature flag is enabled
    if (!incentivizeUpgradeEnabled) {
      return null;
    }

    const resource = this.resource();

    if (!resource) {
      return null;
    }

    const usage = get(resource, 'usage');
    const limit = get(resource, 'limits.maximum');

    const warnThreshold = 0.9;
    const errorThreshold = 0.95;

    const usagePercentage = usage / limit;
    const atLimit = usagePercentage >= 1;

    return (
      <div className={classnames(
        'resource-usage',
        {
          'resource-usage--warn': usage / limit >= warnThreshold && usage / limit < errorThreshold,
          'resource-usage--danger': usage / limit >= errorThreshold
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
          <TextLink onClick={this.upgradeSpace.bind(this)}>Upgrade space</TextLink>
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
