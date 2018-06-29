import React, { Fragment } from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { get } from 'lodash';
import createResourceService from 'services/ResourceService';
import * as LD from 'utils/LaunchDarkly';
import TheAccountView from 'TheAccountView';
import { showDialog as showUpgradeSpaceDialog } from 'services/ChangeSpaceService';
import { href } from 'states/Navigator';

const incentivizeFlagName = 'feature-bv-06-2018-incentivize-upgrade';

const RecordsResourceUsage = createReactClass({
  propTypes: {
    space: PropTypes.object.isRequired
  },
  getInitialState () {
    return {
      incentivizeUpgradeEnabled: false,
      resource: {}
    };
  },
  componentDidMount () {
    LD.getCurrentVariation(incentivizeFlagName).then((incentivizeUpgradeEnabled) => {
      this.setState({ incentivizeUpgradeEnabled });
    });

    this.updateUsage();
  },
  render () {
    const { incentivizeUpgradeEnabled, resource } = this.state;

    const usage = get(resource, 'usage');
    const limit = get(resource, 'limits.maximum');


    if (!limit) {
      return null;
    }

    return (
      <div className={classnames(
        'usage',
        {
          'usage--warn': usage / limit >= 0.9 && usage / limit < 0.95,
          'usage--danger': usage / limit >= 0.95
        }
      )}>
        {getUsageText({usage, limit})} &#32;
        {usage / limit >= 0.9
          ? getUpgradeLink({ incentivizeUpgradeEnabled, upgradeSpace: this.upgradeSpace }) : ''}
      </div>
    );
  },
  updateUsage () {
    const { space } = this.props;

    const resourceService = createResourceService(space.sys.id, 'space');

    resourceService.get('record').then((resource) => {
      this.setState({resource});
    });
  },
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
});

export default RecordsResourceUsage;

function getUsageText ({usage, limit}) {
  if (usage / limit >= 1) {
    return `You've reached the limit of ${limit} records (entries and assets)`;
  } else {
    return `Usage: ${usage} / ${limit} entries and assets`;
  }
}

function getUpgradeLink ({incentivizeUpgradeEnabled, upgradeSpace}) {
  if (incentivizeUpgradeEnabled) {
    return <a className='text-link' onClick={upgradeSpace}>Upgrade space</a>;
  } else {
    const subscriptionState = TheAccountView.getSubscriptionState();

    return <Fragment>
      <a className='text-link' href={href(subscriptionState)}>Go to the subscription page</a>
      &#32;to upgrade.
    </Fragment>;
  }
}
