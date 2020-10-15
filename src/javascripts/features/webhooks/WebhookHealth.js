import React from 'react';
import PropTypes from 'prop-types';
import { getWebhookRepo } from './services/WebhookRepoInstance';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';

const THRESHOLD = { WARNING: 70, SUCCESS: 90 };

const STATUSES = ['LOADING', 'NODATA', 'FAILURE', 'WARNING', 'SUCCESS'];
export const STATUS = STATUSES.reduce((acc, k) => ({ ...acc, [k]: k.toLowerCase() }), {});

function calculateHealth({ calls }) {
  const percentage = Math.round((calls.healthy / calls.total) * 100);

  if (typeof percentage === 'number' && percentage >= 0 && percentage <= 100) {
    const status = percentage > THRESHOLD.WARNING ? STATUS.WARNING : STATUS.FAILURE;

    return {
      percentage,
      status: percentage > THRESHOLD.SUCCESS ? STATUS.SUCCESS : status,
    };
  }
}

export class WebhookHealth extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string.isRequired,
  };

  static contextType = SpaceEnvContext;

  state = {
    status: STATUS.LOADING,
  };

  componentDidMount() {
    const { webhookId } = this.props;
    const { currentSpaceId: spaceId, currentSpace: space } = this.context;
    const webhookRepo = getWebhookRepo({ spaceId, space });

    webhookRepo.logs.getHealth(webhookId).then(
      (data) => this.setState(calculateHealth(data) || { status: STATUS.NODATA }),
      () => this.setState({ status: STATUS.NODATA })
    );
  }

  render() {
    const { percentage, status } = this.state;
    const { LOADING, NODATA } = STATUS;
    const hasValidStatus = ![LOADING, NODATA].includes(status);

    return (
      <React.Fragment>
        {status === LOADING && <span>Loading…</span>}
        {status === NODATA && <span>No data collected yet</span>}
        {hasValidStatus && (
          <span
            data-test-id="health-status-indicator"
            className="webhook-call__status-indicator"
            data-status={status}
          />
        )}
        {hasValidStatus && <span data-test-id="health-percentage">{percentage}%</span>}
      </React.Fragment>
    );
  }
}
