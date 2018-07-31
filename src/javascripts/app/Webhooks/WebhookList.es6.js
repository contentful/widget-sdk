import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';

import $state from '$state';
import Icon from 'ui/Components/Icon';

import WebhookHealth from './WebhookHealth';
import WebhookListSidebar from './WebhookListSidebar';

export default class WebhookList extends React.Component {
  static propTypes = {
    webhooks: PropTypes.array.isRequired,
    webhookRepo: PropTypes.object.isRequired,
    resource: PropTypes.object.isRequired,
    organization: PropTypes.object.isRequired
  }

  render () {
    const {webhooks, webhookRepo, resource, organization} = this.props;

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
                    {webhooks.length > 0 && webhooks.map(wh => {
                      const method = get(wh, ['transformation', 'method'], 'POST');
                      const navigate = () => $state.go('^.detail', { webhookId: wh.sys.id });
                      return (
                        <tr key={wh.sys.id}>
                          <td className="x--medium-cell x--clickable" onClick={navigate}>
                            <strong>{wh.name}</strong>
                          </td>
                          <td className="x--large-cell x--clickable" onClick={navigate}>
                            <code>{method} {wh.url}</code>
                          </td>
                          <td className="x--small-cell x--clickable" onClick={navigate}>
                            <WebhookHealth webhookId={wh.sys.id} webhookRepo={webhookRepo} />
                          </td>
                          <td className="x--medium-cell">
                            <button className="text-link" onClick={navigate}>
                              View details
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {webhooks.length < 1 && <tr><td colSpan="4">No webhooks yet!</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="workbench-main__sidebar">
            <WebhookListSidebar
              webhooks={webhooks}
              resource={resource}
              organization={organization}
            />
          </div>
        </div>
      </React.Fragment>
    );
  }
}
