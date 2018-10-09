import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Icon from 'ui/Components/Icon.es6';
import StateLink from 'app/common/StateLink.es6';

import WebhookHealth from './WebhookHealth.es6';
import WebhookListSidebar from './WebhookListSidebar.es6';

export class WebhookList extends React.Component {
  static propTypes = {
    webhooks: PropTypes.array.isRequired,
    openTemplateDialog: PropTypes.func.isRequired,
    templateId: PropTypes.string
  };

  componentDidMount() {
    if (this.props.templateId) {
      this.props.openTemplateDialog(this.props.templateId);
    }
  }

  render() {
    const { webhooks, openTemplateDialog } = this.props;

    return (
      <div className="workbench webhook-list" data-test-id="webhooks.list">
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
                          <StateLink
                            to="^.detail"
                            params={{
                              webhookId: wh.sys.id
                            }}
                            key={wh.sys.id}>
                            {({ onClick }) => (
                              <tr className="x--clickable" onClick={onClick}>
                                <td className="x--medium-cell">
                                  <strong className="x--ellipsis">{wh.name}</strong>
                                </td>
                                <td className="x--large-cell">
                                  <code className="x--ellipsis">
                                    {get(wh, ['transformation', 'method'], 'POST')} {wh.url}
                                  </code>
                                </td>
                                <td className="x--small-cell">
                                  <WebhookHealth webhookId={wh.sys.id} />
                                </td>
                                <td className="x--medium-cell">
                                  <button className="text-link">View details</button>
                                </td>
                              </tr>
                            )}
                          </StateLink>
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
            <WebhookListSidebar
              webhookCount={webhooks.length}
              openTemplateDialog={openTemplateDialog}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default WebhookList;
