import React from 'react';
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
import { ProductIcon } from '@contentful/forma-36-react-components/dist/alpha';
import { WebhookForm } from './WebhookForm';
import { WebhookSidebar } from './WebhookSidebar';
import * as WebhookEditorActions from './WebhookEditorActions';
import { WebhookRemovalDialog } from './dialogs/WebhookRemovalDialog';
import { WebhookActivityLog } from './WebhookActivityLog';
import * as Navigator from 'states/Navigator';
import { SpaceEnvContext } from 'core/services/SpaceEnvContext/SpaceEnvContext';
import type { WebhookProps } from 'contentful-management/types';

enum TabType {
  Settings = 1,
  Log,
}

const style = {
  actionButton: css({ marginLeft: tokens.spacingM }),
  tabs: css({ marginBottom: tokens.spacingM }),
};

interface WebhookEditorProps {
  initialWebhook: WebhookProps;
  registerSaveAction: (save: (spaceId: string) => Promise<void>) => void;
  setDirty: (dirty: boolean) => void;
}

interface WebhookEditorState {
  tab: TabType;
  webhook: WebhookProps;
  fresh: boolean;
  dirty: boolean;
  busy: boolean;
  isDeleteDialogShown: boolean;
  refreshLog?: ({ spaceId }: { spaceId: string }) => Promise<void>;
}

export class WebhookEditor extends React.Component<WebhookEditorProps, WebhookEditorState> {
  static contextType = SpaceEnvContext;

  constructor(props) {
    super(props);

    // Entity is "fresh" if it's not saved.
    const fresh = !get(props.initialWebhook, ['sys', 'id']);

    this.state = {
      // Fresh entities start with the Settings tab opened.
      tab: fresh ? TabType.Settings : TabType.Log,
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

  onSave(webhook: WebhookProps) {
    this.setState({ webhook, dirty: false, busy: false }, () => this.props.setDirty(false));
  }

  navigateToSaved(webhook: WebhookProps) {
    this.props.setDirty(false);
    return Navigator.go({ path: '^.detail', params: { webhookId: webhook.sys.id } });
  }

  navigateToList(force = false) {
    force && this.props.setDirty(false);
    return Navigator.go({ path: '^.list' });
  }

  save = async (spaceId: string) => {
    const { webhook, fresh } = this.state;

    this.setState({ busy: true });

    try {
      const saved = await WebhookEditorActions.save(webhook, spaceId);

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

  remove = async (spaceId: string) => {
    const { webhook } = this.state;

    this.setState({ busy: true });

    try {
      await WebhookEditorActions.remove(webhook, spaceId);
      this.navigateToList(true);
      Notification.success(`Webhook "${webhook.name}" deleted successfully.`);
    } catch (err) {
      Notification.error('Failed to delete the webhook. Try again.');
    }

    this.setState({ busy: false });
  };

  refreshLog = async () => {
    const { currentSpaceId } = this.context;

    if (typeof this.state.refreshLog === 'function') {
      this.setState({ busy: true });
      // `this.state.refreshLog()` always resolves when HTTP communication is done.
      // `WebhookActivityLog` handles failures internally.
      await this.state.refreshLog({ spaceId: currentSpaceId });
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
          selected={tab === TabType.Settings}
          onSelect={() => this.setState({ tab: TabType.Settings })}>
          Webhook settings
        </Tab>
        <Tab
          id="webhook_activity_log"
          testId="webhook-activity-tab"
          selected={tab === TabType.Log}
          onSelect={() => this.setState({ tab: TabType.Log })}>
          Activity log
        </Tab>
      </Tabs>
    );
  }

  render() {
    const { tab, webhook, fresh, dirty, busy } = this.state;

    const { currentSpaceId } = this.context;

    return (
      <React.Fragment>
        <Workbench testId="webhook-editor-page">
          <Workbench.Header
            onBack={() => {
              Navigator.go({ path: '^.list' });
            }}
            icon={<ProductIcon icon="Settings" size="large" />}
            title={`Webhook: ${webhook.name || 'Unnamed'}${dirty ? '*' : ''}`}
            actions={
              <>
                {tab === TabType.Settings && !fresh && (
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

                {tab === TabType.Settings && (
                  <Button
                    className={style.actionButton}
                    testId="webhook-save"
                    buttonType="positive"
                    disabled={!dirty}
                    loading={busy}
                    onClick={() => this.save(currentSpaceId)}>
                    Save
                  </Button>
                )}

                {tab === TabType.Log && (
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
          {tab === TabType.Settings && (
            <Workbench.Content type="full" testId="webhook-settings">
              {!fresh && this.renderTabs()}
              <TabPanel id="webhook_settings">
                <WebhookForm webhook={webhook} onChange={this.onChange} />
              </TabPanel>
            </Workbench.Content>
          )}
          {tab === TabType.Log && (
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
          {tab === TabType.Settings && (
            <Workbench.Sidebar position="right">
              <WebhookSidebar />
            </Workbench.Sidebar>
          )}
        </Workbench>
        <WebhookRemovalDialog
          isShown={this.state.isDeleteDialogShown}
          webhookUrl={this.state.webhook.url}
          isConfirmLoading={busy}
          onConfirm={() => this.remove(currentSpaceId)}
          onCancel={() => {
            this.setState({ isDeleteDialogShown: false });
          }}
        />
      </React.Fragment>
    );
  }
}
