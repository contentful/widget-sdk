import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import {
  Button,
  Notification,
  Tabs,
  Tab,
  TabPanel,
  Workbench,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import NavigationIcon from 'ui/Components/NavigationIcon';
import { WebhookForm } from './WebhookForm';
import { WebhookSidebar } from './WebhookSidebar';
import * as WebhookEditorActions from './WebhookEditorActions';
import { WebhookRemovalDialog } from './dialogs/WebhookRemovalDialog';
import { WebhookActivityLog } from './WebhookActivityLog';
import * as Navigator from 'states/Navigator';

const TABS = { SETTINGS: 1, LOG: 2 };

const style = {
  actionButton: css({ marginLeft: tokens.spacingM }),
  tabs: css({ marginBottom: tokens.spacingM }),
};

export class WebhookEditor extends React.Component {
  static propTypes = {
    initialWebhook: PropTypes.object.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
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
      isDeleteDialogShown: false,
    };
  }

  componentDidMount() {
    this.props.setDirty(this.state.dirty);
    this.props.registerSaveAction(this.save);
  }

  onChange = (change) => {
    this.setState(
      (s) => ({
        ...s,
        webhook: { ...s.webhook, ...change },
        dirty: true,
      }),
      () => this.props.setDirty(true)
    );
  };

  onSave(webhook) {
    this.setState({ webhook, dirty: false, busy: false }, () => this.props.setDirty(false));
  }

  navigateToSaved(webhook) {
    this.props.setDirty(false);
    return Navigator.go({ path: '^.detail', params: { webhookId: webhook.sys.id } });
  }

  navigateToList(force = false) {
    force && this.props.setDirty(false);
    return Navigator.go({ path: '^.list' });
  }

  save = async () => {
    const { webhook, fresh } = this.state;

    this.setState({ busy: true });

    try {
      const saved = await WebhookEditorActions.save(webhook);

      if (fresh) {
        this.navigateToSaved(saved);
      } else {
        this.onSave(saved);
      }

      Notification.success(`Webhook "${saved.name}" saved successfully.`);
    } catch (err) {
      Notification.error(err.message);
    }

    this.setState({ busy: false });
  };

  remove = async () => {
    const { webhook } = this.state;

    this.setState({ busy: true });

    try {
      await WebhookEditorActions.remove(webhook);
      this.navigateToList(true);
      Notification.success(`Webhook "${webhook.name}" deleted successfully.`);
    } catch (err) {
      Notification.error('Failed to delete the webhook. Try again.');
    }

    this.setState({ busy: false });
  };

  refreshLog = async () => {
    if (typeof this.state.refreshLog === 'function') {
      this.setState({ busy: true });
      // `this.state.refreshLog()` always resolves when HTTP communication is done.
      // `WebhookActivityLog` handles failures internally.
      await this.state.refreshLog();
      this.setState({ busy: false });
    }
  };

  renderTabs() {
    const { tab } = this.state;
    return (
      <Tabs role="tablist" className={style.tabs}>
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
              Navigator.go({ path: '^.list' });
            }}
            icon={<NavigationIcon icon="settings" color="green" size="large" />}
            title={`Webhook: ${webhook.name || 'Unnamed'}${dirty ? '*' : ''}`}
            actions={
              <>
                {tab === TABS.SETTINGS && !fresh && (
                  <Button
                    className={style.actionButton}
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
                    className={style.actionButton}
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
                    className={style.actionButton}
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
                  registerLogRefreshAction={(refreshLog) => this.setState({ refreshLog })}
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
