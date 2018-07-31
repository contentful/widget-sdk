import React from 'react';
import PropTypes from 'prop-types';

import {STATUS} from './WebhookHealth';

const ERROR_NAMES = {
  TimeoutError: 'Timeout',
  ConnectionResetError: 'Connection reset',
  HostUnreachableError: 'Host unreachable',
  ProtocolError: 'Invalid protocol',
  IPForbiddenError: 'Forbidden IP address',
  NameResolutionError: 'Name unresolvable'
};

function getStatus (code) {
  const hasCode = typeof code === 'number';

  if (hasCode && code < 300) {
    return STATUS.SUCCESS;
  } else if (hasCode && code < 400) {
    return STATUS.WARNING;
  } else {
    return STATUS.FAILURE;
  }
}

export default class WebhookCallStatus extends React.Component {
  static propTypes = {
    call: PropTypes.object.isRequired
  }

  render () {
    const {call} = this.props;
    const code = call.statusCode;
    const status = getStatus(code);
    const errorName = (call.errors || [])[0];
    const error = ERROR_NAMES[errorName];

    return (
      <div className="webhook-call__status">
        <span className="webhook-call__status-indicator" data-status={status} />
        {code && <span>HTTP {code}</span>}
        {error && <span>{error}</span>}
        {!error && !code && <span>Unknown error</span>}
      </div>
    );
  }
}
