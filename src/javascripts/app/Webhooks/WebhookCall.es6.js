import React from 'react';
import PropTypes from 'prop-types';

import $state from '$state';
import Icon from 'ui/Components/Icon';

import WebhookCallStatus from './WebhookCallStatus';

const parseJsonSafe = s => {
  try {
    return JSON.parse(s);
  } catch (e) { /* ignore */ } // eslint-disable-line no-empty
};

export default class WebhookCall extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    call: PropTypes.object.isRequired
  }

  render () {
    const {webhook, call} = this.props;

    const reqBody = call.request.body;
    const reqBodyJson = parseJsonSafe(reqBody);
    const reqHeaders = call.request.headers;

    const resBody = call.response.body;
    const resBodyJson = parseJsonSafe(resBody);
    const resHeaders = call.response.headers;

    return (
      <React.Fragment>
        <div className="workbench-header__wrapper">
          <header className="workbench-header">
            <div className="workbench-header__icon cf-icon">
              <Icon name="page-settings" scale="0.75" />
            </div>
            <h1 className="workbench-header__title">
              Call details for {webhook.name} at {call.requestAt}
            </h1>
            <div className="workbench-header__actions">
              <button className="btn-secondary-action" onClick={() => $state.go('^')}>
                Close
              </button>
            </div>
          </header>
        </div>
        <div className="workbench-main">
          <div className="workbench-main__content">
            <div className="webhook-call__details">
              <div className="webhook-call__header">
                <strong className="webhook-call__header-item x--ellipsis">
                  {webhook.name}
                </strong>
                <code className="webhook-call__header-item x--ellipsis">
                   {call.request.method} {call.url }
                </code>
                <span className="webhook-call__header-item x--nowrap">
                  {call.requestAt}
                </span>
                <div className="webhook-call__header-item x--nowrap">
                  <WebhookCallStatus call={call} />
                </div>
              </div>
              <div className="webhook-call__columns">
                <div className="webhook-call__column">
                  <strong>Request headers</strong>
                  <pre>{JSON.stringify(reqHeaders, null, 2)}</pre>

                  <strong>Request body</strong>
                  {reqBodyJson && <pre>{JSON.stringify(reqBodyJson, null, 2)}</pre>}
                  {!reqBodyJson && <pre>{reqBody}</pre>}
                </div>
                <div className="webhook-call__column">
                  <strong>Response headers</strong>
                  <pre>{JSON.stringify(resHeaders, null, 2)}</pre>

                  <strong>Response body</strong>
                  {resBodyJson && <pre>{JSON.stringify(resBodyJson, null, 2)}</pre>}
                  {!resBodyJson && <pre>{resBody}</pre>}
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
