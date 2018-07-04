import React, { Fragment } from 'react';
import PropTypes from 'prop-types';

import TheAccountView from 'TheAccountView';
import { href } from 'states/Navigator';

export default function UpgradeLink ({ incentivizeUpgradeEnabled, upgradeSpace }) {
  const subscriptionState = TheAccountView.getSubscriptionState();

  return (
    <Fragment>
      {
        incentivizeUpgradeEnabled &&
        <a className='text-link' onClick={upgradeSpace}>Upgrade space</a>
      }
      {
        !incentivizeUpgradeEnabled &&
        <Fragment>
          <a className='text-link' href={href(subscriptionState)}>Go to the subscription page</a> &#32;to upgrade.
      </Fragment>
      }
    </Fragment>
  );
}

UpgradeLink.propTypes = {
  incentivizeUpgradeEnabled: PropTypes.bool.isRequired,
  upgradeSpace: PropTypes.func.isRequired
};
