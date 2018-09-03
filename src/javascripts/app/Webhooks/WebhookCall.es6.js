import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import Icon from 'ui/Components/Icon';

import WebhookCallStatus from './WebhookCallStatus';

const ServicesConsumer = require('../../reactServiceContext').default;

const parseJsonSafe = s => {
  try {
    return JSON.parse(s);
  } catch (e) {
    /* ignore */
  } // eslint-disable-line no-empty
};

class WebhookCall extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    call: PropTypes.object.isRequired,

    $services: PropTypes.shape({
      $state: PropTypes.object
    }).isRequired
  };

  render() {
    const { webhook, call, $services } = this.props;

    const reqBody = get(call, ['request', 'body']);
    const reqBodyJson = parseJsonSafe(reqBody);
    const reqHeaders = get(call, ['request', 'headers']);

    const resBody = get(call, ['response', 'body']);
    const resBodyJson = parseJsonSafe(resBody);
    const resHeaders = get(call, ['response', 'headers']);

    return (
      <React.Fragment>
        <div className="workbench-header__wrapper">
          <header className="workbench-header">
            <div className="breadcrumbs-widget">
              <div className="breadcrumbs-container">
                <div className="btn btn__back" onClick={() => $services.$state.go('^')}>
                  <Icon name="back" />
                </div>
              </div>
            </div>
            <div className="workbench-header__icon cf-icon">
              <Icon name="page-settings" scale="0.75" />
            </div>
            <h1 className="workbench-header__title">
              Call details for {webhook.name} at {call.requestAt}
            </h1>
          </header>
        </div>
        <div className="workbench-main">
          <div className="workbench-main__content">
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
          </div>
        </div>
      </React.Fragment>
    );
  }
}

export default ServicesConsumer('$state')(WebhookCall);
