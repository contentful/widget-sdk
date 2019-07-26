import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Button, Notification, Tabs, Tab, TabPanel } from '@contentful/forma-36-react-components';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import Icon from 'ui/Components/Icon.es6';
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

  renderTabs() {
    const { tab } = this.state;
    return (
      <Tabs role="tablist" className="f36-margin-bottom--m">
        <Tab
          id="webhook_settings"
          testId="webhook-settings-tab"
          selected={tab === TABS.SETTINGS}
          onSelect={() => this.setState({ tab: TABS.SETTINGS })}>
          Webhook settings
        </Tab>
        <Tab
          id="webhook_activity_log"
          testId="webhook-activity-tab"
          selected={tab === TABS.LOG}
          onSelect={() => this.setState({ tab: TABS.LOG })}>
          Activity log
        </Tab>
      </Tabs>
    );
  }

  render() {
    const { tab, webhook, fresh, dirty, busy } = this.state;

    return (
      <React.Fragment>
        <Workbench testId="webhook-editor-page">
          <Workbench.Header
            onBack={() => {
              $state.go('^.list');
            }}
            icon={<Icon name="page-settings" scale="0.8" />}
            title={`Webhook: ${webhook.name || 'Unnamed'}${dirty ? '*' : ''}`}
            actions={
              <>
                {tab === TABS.SETTINGS && !fresh && (
                  <Button
                    className="f36-margin-left--m"
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
                    className="f36-margin-left--m"
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
                    className="f36-margin-left--m"
                    testId="webhook-refresh-log"
                    buttonType="muted"
                    loading={busy}
                    onClick={this.refreshLog}>
                    Refresh log
                  </Button>
                )}
              </>
            }
          />
          {tab === TABS.SETTINGS && (
            <Workbench.Content type="full" testId="webhook-settings">
              {!fresh && this.renderTabs()}
              <TabPanel id="webhook_settings">
                <WebhookForm webhook={webhook} onChange={this.onChange} />
              </TabPanel>
            </Workbench.Content>
          )}
          {tab === TABS.LOG && (
            <Workbench.Content type="full" testId="webhook-activity">
              {!fresh && this.renderTabs()}
              <TabPanel id="webhook_activity_log">
                <WebhookActivityLog
                  webhookId={webhook.sys.id}
                  webhookRepo={spaceContext.webhookRepo}
                  registerLogRefreshAction={refreshLog => this.setState({ refreshLog })}
                />
              </TabPanel>
            </Workbench.Content>
          )}
          {tab === TABS.SETTINGS && (
            <Workbench.Sidebar position="right">
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
