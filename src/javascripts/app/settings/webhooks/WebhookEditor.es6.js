import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Button, Notification } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import WebhookForm from './WebhookForm.es6';
import WebhookSidebar from './WebhookSidebar.es6';
import * as WebhookEditorActions from './WebhookEditorActions.es6';
import WebhookRemovalDialog from './dialogs/WebhookRemovalDialog.es6';
import WebhookActivityLog from './WebhookActivityLog.es6';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const $state = getModule('$state');

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
      busy: false,
      isDeleteDialogShown: false
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
        Notification.error(err.message);
        this.setState({ busy: false });
        return Promise.reject(err);
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
      <React.Fragment>
        <Workbench className="webhook-editor">
          <Workbench.Header>
            <Workbench.Header.Back to="^.list" testId="webhook-back" />
            <Workbench.Icon icon="page-settings" />
            <Workbench.Title>
              Webhook: {webhook.name || 'Unnamed'}
              {dirty ? '*' : ''}
            </Workbench.Title>
            <Workbench.Header.Actions>
              {tab === TABS.SETTINGS && !fresh && (
                <Button
                  testId="webhook-remove"
                  buttonType="muted"
                  onClick={() => {
                    this.setState({ isDeleteDialogShown: true });
                  }}>
                  Remove
                </Button>
              )}

              {tab === TABS.SETTINGS && (
                <Button
                  testId="webhook-save"
                  buttonType="positive"
                  disabled={!dirty}
                  loading={busy}
                  onClick={this.save}>
                  Save
                </Button>
              )}

              {tab === TABS.LOG && (
                <Button
                  testId="webhook-refresh-log"
                  buttonType="muted"
                  loading={busy}
                  onClick={this.refreshLog}>
                  Refresh log
                </Button>
              )}
            </Workbench.Header.Actions>
          </Workbench.Header>
          {!fresh && (
            <Workbench.Nav>
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
            </Workbench.Nav>
          )}
          {tab === TABS.SETTINGS && (
            <Workbench.Content>
              <WebhookForm webhook={webhook} onChange={this.onChange} />
            </Workbench.Content>
          )}
          {tab === TABS.LOG && (
            <Workbench.Content>
              <WebhookActivityLog
                webhookId={webhook.sys.id}
                webhookRepo={spaceContext.webhookRepo}
                registerLogRefreshAction={refreshLog => this.setState({ refreshLog })}
              />
            </Workbench.Content>
          )}
          {tab === TABS.SETTINGS && (
            <Workbench.Sidebar>
              <WebhookSidebar />
            </Workbench.Sidebar>
          )}
        </Workbench>
        <WebhookRemovalDialog
          isShown={this.state.isDeleteDialogShown}
          webhookUrl={this.state.webhook.url}
          isConfirmLoading={busy}
          onConfirm={this.remove}
          onCancel={() => {
            this.setState({ isDeleteDialogShown: false });
          }}
        />
      </React.Fragment>
    );
  }
}

export default WebhookEditor;
