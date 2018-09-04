import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import notification from 'notification';

import $state from '$state';
import Icon from 'ui/Components/Icon.es6';

import WebhookForm from './WebhookForm.es6';
import WebhookSidebar from './WebhookSidebar.es6';
import * as WebhookEditorActions from './WebhookEditorActions.es6';
import WebhookActivityLog from './WebhookActivityLog.es6';

const TABS = { SETTINGS: 1, LOG: 2 };

const hasBasic = webhook => typeof webhook.httpBasicUsername === 'string';

export default class WebhookEditor extends React.Component {
  static propTypes = {
    initialWebhook: PropTypes.object.isRequired,
    webhookRepo: PropTypes.object.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);

    // Entity is "fresh" if it's not saved.
    const fresh = !get(props.initialWebhook, ['sys', 'id']);

    this.state = {
      // Fresh entities start with the Settings tab opened.
      tab: fresh ? TABS.SETTINGS : TABS.LOG,
      webhook: props.initialWebhook,
      fresh,
      // Entity is "dirty" when not saved or there were changes to the initially loaded version.
      dirty: fresh,
      hasHttpBasicStored: hasBasic(props.initialWebhook),
      // Editor is "busy" if there's any HTTP request in flight.
      // All buttons triggering HTTP requests are disabled then.
      busy: false
    };
  }

  componentDidMount() {
    this.props.setDirty(this.state.dirty);
    this.props.registerSaveAction(this.save);
  }

  propagateChange() {
    this.props.setDirty(this.state.dirty);
    this.props.onChange(this.state.webhook);
  }

  onChange = change => {
    this.setState(
      s => ({
        ...s,
        webhook: { ...s.webhook, ...change },
        dirty: true,
        // we clear stored HTTP Basic Auth credentials when change contains
        // `httpBasicUsername` property set to `null`. Otherwise we use
        // the previous value.
        hasHttpBasicStored: change.httpBasicUsername === null ? false : s.hasHttpBasicStored
      }),
      () => this.propagateChange()
    );
  };

  onSave(webhook) {
    this.setState(
      { webhook, dirty: false, hasHttpBasicStored: hasBasic(webhook), busy: false },
      () => this.propagateChange()
    );
  }

  navigateToSaved(webhook) {
    this.props.setDirty(false);
    return $state.go('^.detail', { webhookId: webhook.sys.id });
  }

  navigateToList(force = false) {
    force && this.props.setDirty(false);
    return $state.go('^.list');
  }

  save = () => {
    const { webhookRepo } = this.props;
    const { webhook, fresh } = this.state;

    this.setState({ busy: true });

    return WebhookEditorActions.save(webhookRepo, webhook).then(
      saved => (fresh ? this.navigateToSaved(saved) : this.onSave(saved)),
      err => {
        notification.error(err.message);
        this.setState({ busy: false });
      }
    );
  };

  remove = () => {
    const { webhookRepo } = this.props;
    const { webhook } = this.state;

    const notBusy = () => this.setState({ busy: false });
    this.setState({ busy: true });

    return WebhookEditorActions.remove(webhookRepo, webhook).then(
      ({ removed }) => (removed ? this.navigateToList(true) : notBusy()),
      () => notBusy()
    );
  };

  refreshLog = () => {
    if (typeof this.state.refreshLog === 'function') {
      this.setState({ busy: true });
      // `this.state.refreshLog()` always resolves when HTTP communication is done.
      // `WebhookActivityLog` handles failures internally.
      this.state.refreshLog().then(() => this.setState({ busy: false }));
    }
  };

  render() {
    const { tab, webhook, fresh, dirty, hasHttpBasicStored, busy } = this.state;

    return (
      <React.Fragment>
        <div className="workbench-header__wrapper">
          <header className="workbench-header">
            <div className="breadcrumbs-widget">
              <div className="breadcrumbs-container">
                <div className="btn btn__back" onClick={() => this.navigateToList()}>
                  <Icon name="back" />
                </div>
              </div>
            </div>

            <div className="workbench-header__icon cf-icon">
              <Icon name="page-settings" scale="0.75" />
            </div>

            <h1 className="workbench-header__title">
              Webhook: {webhook.name || 'Unnamed'}
              {dirty ? '*' : ''}
            </h1>

            <div className="workbench-header__actions">
              {tab === TABS.SETTINGS &&
                !fresh && (
                  <button className="btn-secondary-action" disabled={busy} onClick={this.remove}>
                    Remove
                  </button>
                )}

              {tab === TABS.SETTINGS && (
                <button
                  className="btn-primary-action"
                  disabled={!dirty || busy}
                  onClick={this.save}>
                  Save
                </button>
              )}

              {tab === TABS.LOG && (
                <button className="btn-secondary-action" disabled={busy} onClick={this.refreshLog}>
                  Refresh log
                </button>
              )}
            </div>
          </header>
        </div>

        {!fresh && (
          <div className="workbench-nav">
            <ul className="workbench-nav__tabs">
              <li
                role="tab"
                aria-selected={tab === TABS.SETTINGS}
                onClick={() => this.setState({ tab: TABS.SETTINGS })}>
                Webhook settings
              </li>
              <li
                role="tab"
                aria-selected={tab === TABS.LOG}
                onClick={() => this.setState({ tab: TABS.LOG })}>
                Activity log
              </li>
            </ul>
          </div>
        )}

        {tab === TABS.SETTINGS && (
          <div className="workbench-main">
            <div className="workbench-main__content">
              <WebhookForm
                webhook={webhook}
                hasHttpBasicStored={hasHttpBasicStored}
                onChange={this.onChange}
              />
            </div>
            <div className="workbench-main__sidebar">
              <WebhookSidebar />
            </div>
          </div>
        )}

        {tab === TABS.LOG && (
          <div className="workbench-main">
            <div className="workbench-main__content">
              <WebhookActivityLog
                webhookId={webhook.sys.id}
                webhookRepo={this.props.webhookRepo}
                registerLogRefreshAction={refreshLog => this.setState({ refreshLog })}
              />
            </div>
          </div>
        )}
      </React.Fragment>
    );
  }
}
