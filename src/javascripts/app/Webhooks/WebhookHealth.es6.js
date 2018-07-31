import React from 'react';
import PropTypes from 'prop-types';

const THRESHOLD = {WARNING: 70, SUCCESS: 90};
const STATUSES = ['LOADING', 'NODATA', 'FAILURE', 'WARNING', 'SUCCESS'];
const STATUS = STATUSES.reduce((acc, k) => ({...acc, [k]: k.toLowerCase()}), {});

function calculateHealth ({calls}) {
  const percentage = Math.round(calls.healthy / calls.total * 100);

  if (typeof percentage === 'number' && percentage >= 0 && percentage <= 100) {
    const status = percentage > THRESHOLD.WARNING ? STATUS.WARNING : STATUS.FAILURE;

    return {
      percentage,
      status: percentage > THRESHOLD.SUCCESS ? STATUS.SUCCESS : status
    };
  }
}

export default class WebhookHealth extends React.Component {
  static propTypes = {
    webhookId: PropTypes.string.isRequired,
    webhookRepo: PropTypes.object.isRequired
  }

  constructor (props) {
    super(props);
    this.state = {status: STATUS.LOADING};
  }

  componentDidMount () {
    const {webhookId, webhookRepo} = this.props;

    webhookRepo.logs.getHealth(webhookId).then(
      data => this.setState(calculateHealth(data) || {status: STATUS.NODATA}),
      () => this.setState({status: STATUS.NODATA})
    );
  }

  render () {
    const {percentage, status} = this.state;
    const {LOADING, NODATA} = STATUS;
    const hasValidStatus = ![LOADING, NODATA].includes(status);

    return (
      <React.Fragment>
        {status === LOADING && <span>Loading…</span>}
        {status === NODATA && <span>No data collected yet</span>}
        {hasValidStatus && <span className="webhook-call__status-indicator" data-status={status} />}
        {hasValidStatus && <span>{percentage}%</span>}
      </React.Fragment>
    );
  }
}
