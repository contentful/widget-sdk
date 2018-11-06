import React from 'react';
import PropTypes from 'prop-types';
import Workbench from 'app/common/Workbench.es6';
import { get } from 'lodash';
import Icon from 'ui/Components/Icon.es6';
import StateLink from 'app/common/StateLink.es6';

import WebhookCallStatus from './WebhookCallStatus.es6';

const parseJsonSafe = s => {
  try {
    return JSON.parse(s);
  } catch (e) {
    /* ignore */
  } // eslint-disable-line no-empty
};

export class WebhookCall extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    call: PropTypes.object.isRequired
  };

  render() {
    const { webhook, call } = this.props;

    const reqBody = get(call, ['request', 'body']);
    const reqBodyJson = parseJsonSafe(reqBody);
    const reqHeaders = get(call, ['request', 'headers']);

    const resBody = get(call, ['response', 'body']);
    const resBodyJson = parseJsonSafe(resBody);
    const resHeaders = get(call, ['response', 'headers']);

    return (
      <Workbench className="webhook-call">
        <Workbench.Header>
          <div className="breadcrumbs-widget">
            <div className="breadcrumbs-container">
              <StateLink to="^">
                {({ onClick }) => (
                  <div className="btn btn__back" onClick={onClick}>
                    <Icon name="back" />
                  </div>
                )}
              </StateLink>
            </div>
          </div>
          <Workbench.Icon icon="page-settings" />
          <Workbench.Title>
            Call details for {webhook.name} at {call.requestAt}
          </Workbench.Title>
        </Workbench.Header>
        <Workbench.Content>
          <div className="webhook-call__details">
            <div className="webhook-call__header">
              <strong className="webhook-call__header-item x--ellipsis">{webhook.name}</strong>
              <code className="webhook-call__header-item x--ellipsis">
                {call.request.method} {call.url}
              </code>
              <span className="webhook-call__header-item x--nowrap">{call.requestAt}</span>
              <div className="webhook-call__header-item x--nowrap">
                <WebhookCallStatus call={call} />
              </div>
            </div>
            <div className="webhook-call__columns">
              <div className="webhook-call__column">
                <strong>Request headers</strong>
                <pre>{JSON.stringify(reqHeaders, null, 2) || '(none)'}</pre>

                <strong>Request body</strong>
                {reqBodyJson && <pre>{JSON.stringify(reqBodyJson, null, 2) || '(none)'}</pre>}
                {!reqBodyJson && <pre>{reqBody || '(none)'}</pre>}
              </div>
              <div className="webhook-call__column">
                <strong>Response headers</strong>
                <pre>{JSON.stringify(resHeaders, null, 2) || '(none)'}</pre>

                <strong>Response body</strong>
                {resBodyJson && <pre>{JSON.stringify(resBodyJson, null, 2) || '(none)'}</pre>}
                {!resBodyJson && <pre>{resBody || '(none)'}</pre>}
              </div>
            </div>
          </div>
        </Workbench.Content>
      </Workbench>
    );
  }
}

export default WebhookCall;
