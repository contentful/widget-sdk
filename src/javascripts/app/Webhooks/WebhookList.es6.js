import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';

import $state from '$state';
import Icon from 'ui/Components/Icon';

import WebhookHealth from './WebhookHealth';
import WebhookListSidebar from './WebhookListSidebar';

export default class WebhookList extends React.Component {
  static propTypes = {
    webhooks: PropTypes.array.isRequired,
    webhookRepo: PropTypes.object.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    resource: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired,
    openTemplateDialog: PropTypes.func.isRequired
  };

  render() {
    const { webhooks, webhookRepo } = this.props;

    return (
      <React.Fragment>
        <div className="workbench-header__wrapper">
          <header className="workbench-header">
            <div className="workbench-header__icon cf-icon">
              <Icon name="page-settings" scale="0.75" />
            </div>
            <h1 className="workbench-header__title">Webhooks ({webhooks.length})</h1>
          </header>
        </div>
        <div className="workbench-main">
          <div className="workbench-main__content">
            <div className="table">
              <div className="table__head">
                <table>
                  <thead>
                    <tr>
                      <th className="x--medium-cell">Webhook name</th>
                      <th className="x--large-cell">URL</th>
                      <th className="x--small-cell">% of successful calls</th>
                      <th className="x--medium-cell">Actions</th>
                    </tr>
                  </thead>
                </table>
              </div>
              <div className="table__body">
                <table>
                  <tbody>
                    {webhooks.length > 0 &&
                      webhooks.map(wh => {
                        return (
                          <tr
                            className="x--clickable"
                            key={wh.sys.id}
                            onClick={() => $state.go('^.detail', { webhookId: wh.sys.id })}>
                            <td className="x--medium-cell">
                              <strong className="x--ellipsis">{wh.name}</strong>
                            </td>
                            <td className="x--large-cell">
                              <code className="x--ellipsis">
                                {get(wh, ['transformation', 'method'], 'POST')} {wh.url}
                              </code>
                            </td>
                            <td className="x--small-cell">
                              <WebhookHealth webhookId={wh.sys.id} webhookRepo={webhookRepo} />
                            </td>
                            <td className="x--medium-cell">
                              <button className="text-link">View details</button>
                            </td>
                          </tr>
                        );
                      })}
                    {webhooks.length < 1 && (
                      <tr>
                        <td colSpan="4">Add a webhook, then manage it in this space.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="workbench-main__sidebar">
            <WebhookListSidebar {...this.props} />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
