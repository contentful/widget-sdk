import React from 'react';
import PropTypes from 'prop-types';

import { STATUS } from './WebhookHealth.es6';

// This needs to be kept in sync with the error classes in the webhook
// consumer:
// https://github.com/contentful/webhook_consumer/tree/master/lib/request/base-request/errors
const ERROR_NAMES = {
  AddressNotAvailableError: 'The destination address was not routable',
  AddressNotFoundError: 'The address could not be found',
  ConnectionRefusedError: 'The connection has been refused',
  ConnectionResetError: 'Connection reset',
  ExpiredCertificateError: 'Certificate has expired',
  HostUnreachableError: 'Host unreachable',
  HostnameAltnameMismatchError: "Hostname/IP doesn't match certificate's altnames",
  InvalidResponseError: 'The HTTP response was malformed or invalid',
  IPForbiddenError: 'Forbidden IP address',
  LeafSignatureError: 'Unable to verify the first certificate',
  NameResolutionError: 'Name unresolvable',
  NetworkUnreachableError: 'The target network is unreachable',
  ProtocolError: 'Invalid protocol',
  SelfSignedCertificateError: 'Self signed certificate',
  TimeoutError: 'Timeout'
};

function getStatus(code) {
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
  };

  render() {
    const { call } = this.props;
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
