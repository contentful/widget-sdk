import React from 'react';
import PropTypes from 'prop-types';
import {pick} from 'lodash';

import $state from '$state';
import Icon from 'ui/Components/Icon';

import WebhookCallStatus from './WebhookCallStatus';

export default class WebhookCall extends React.Component {
  static propTypes = {
    webhook: PropTypes.object.isRequired,
    call: PropTypes.object.isRequired
  }

  render () {
    const {webhook, call} = this.props;
    const {body} = call.request;
    const details = pick(call.request, ['method', 'url', 'headers']);

    let jsonBody;
    try {
      jsonBody = JSON.parse(body);
    } catch (e) { /* ignore */ } // eslint-disable-line no-empty

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
                <strong className="webhook-call__header-item">
                  {webhook.name} ({call.url })
                </strong>
                <span className="webhook-call__header-item">
                  {call.requestAt}
                </span>
                <div className="webhook-call__header-item">
                  <WebhookCallStatus call={call} />
                </div>
              </div>
              <div className="webhook-call__columns">
                <div className="webhook-call__column">
                  <strong>Request details</strong>
                  <pre>{JSON.stringify(details, null, 2)}</pre>

                  <strong>Request body</strong>
                  {jsonBody && <pre>{JSON.stringify(jsonBody, null, 2)}</pre>}
                  {!jsonBody && <pre>{body}</pre>}
                </div>
                <div className="webhook-call__column">
                  <strong>Complete response</strong>
                  <pre>{JSON.stringify(call.response, null, 2)}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }
}
