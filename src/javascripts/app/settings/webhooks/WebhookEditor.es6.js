import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import Icon from 'ui/Components/Icon.es6';
import notification from 'notification';
import WebhookForm from './WebhookForm.es6';
import WebhookSidebar from './WebhookSidebar.es6';
import * as WebhookEditorActions from './WebhookEditorActions.es6';
import spaceContext from 'spaceContext';
import $state from '$state';
import WebhookActivityLog from './WebhookActivityLog.es6';

const TABS = { SETTINGS: 1, LOG: 2 };

class WebhookEditor extends React.Component {
  static propTypes = {
    initialWebhook: PropTypes.object.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired
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
      // Editor is "busy" if there's any HTTP request in flight.
      // All buttons triggering HTTP requests are disabled then.
      busy: false
    };
  }

  componentDidMount() {
    this.props.setDirty(this.state.dirty);
    this.props.registerSaveAction(this.save);
  }

  onChange = change => {
    this.setState(
      s => ({
        ...s,
        webhook: { ...s.webhook, ...change },
        dirty: true
      }),
      () => this.props.setDirty(true)
    );
  };

  onSave(webhook) {
    this.setState({ webhook, dirty: false, busy: false }, () => this.props.setDirty(false));
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
    const { webhook, fresh } = this.state;

    this.setState({ busy: true });

    return WebhookEditorActions.save(spaceContext.webhookRepo, webhook, null).then(
      saved => (fresh ? this.navigateToSaved(saved) : this.onSave(saved)),
      err => {
        notification.error(err.message);
        this.setState({ busy: false });
      }
    );
  };

  remove = () => {
    const { webhook } = this.state;

    const notBusy = () => this.setState({ busy: false });
    this.setState({ busy: true });

    return WebhookEditorActions.remove(spaceContext.webhookRepo, webhook).then(
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
    const { tab, webhook, fresh, dirty, busy } = this.state;

    return (
      <div className="workbench webhook-editor">
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
                  <button
                    data-test-id="webhook-remove"
                    className="btn-secondary-action"
                    disabled={busy}
                    onClick={this.remove}>
                    Remove
                  </button>
                )}

              {tab === TABS.SETTINGS && (
                <button
                  data-test-id="webhook-save"
                  className="btn-primary-action"
                  disabled={!dirty || busy}
                  onClick={this.save}>
                  Save
                </button>
              )}

              {tab === TABS.LOG && (
                <button
                  data-test-id="webhook-refresh-log"
                  className="btn-secondary-action"
                  disabled={busy}
                  onClick={this.refreshLog}>
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
              <WebhookForm webhook={webhook} onChange={this.onChange} />
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
                webhookRepo={spaceContext.webhookRepo}
                registerLogRefreshAction={refreshLog => this.setState({ refreshLog })}
              />
            </div>
          </div>
        )}
      </div>
    );
  }
}

export default WebhookEditor;
