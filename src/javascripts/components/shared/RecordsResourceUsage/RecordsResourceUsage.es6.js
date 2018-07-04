import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { get } from 'lodash';
import createResourceService from 'services/ResourceService';
import * as LD from 'utils/LaunchDarkly';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';

import UpgradeLink from './UpgradeLink';

const incentivizeFlagName = 'feature-bv-06-2018-incentivize-upgrade';

export default class RecordsResourceUsage extends React.Component {
  static propTypes = {
    space: PropTypes.object.isRequired
  }

  constructor () {
    super();

    this.state = {
      incentivizeUpgradeEnabled: false,
      resource: {}
    };
  }

  componentDidMount () {
    LD.getCurrentVariation(incentivizeFlagName).then((incentivizeUpgradeEnabled) => {
      this.setState({ incentivizeUpgradeEnabled });
    });

    this.updateUsage();
  }

  updateUsage () {
    const { space } = this.props;

    const resourceService = createResourceService(space.sys.id, 'space');

    resourceService.get('record').then((resource) => {
      this.setState({resource});
    });
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
    const { incentivizeUpgradeEnabled, resource } = this.state;

    const usage = get(resource, 'usage');
    const limit = get(resource, 'limits.maximum');

    if (!limit) {
      return null;
    }

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
