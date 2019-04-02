import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { cloneDeep } from 'lodash';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import {
  Button,
  Note,
  Select,
  Option,
  Notification,
  Typography,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import FeedbackButton from 'app/common/FeedbackButton.es6';
import * as Analytics from 'analytics/Analytics.es6';
import { fetchExtension } from 'app/settings/extensions/dialogs/GitHubFetcher.es6';

import AppIcon from '../_common/AppIcon.es6';
import makeSidebar from './sidebar.es6';

const EMPTY_OPTION = '!!empty!!ct!!option!!';

const UIE_GH_URL =
  'https://github.com/contentful/extensions/blob/master/samples/basic-approval-workflow/extension.json';

const styles = {
  section: css({
    marginBottom: tokens.spacingXl
  })
};

export default class ApprovalWorkflowAppPage extends Component {
  state = {};

  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    client: PropTypes.shape({
      save: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired
    }).isRequired,
    cmaClient: PropTypes.shape({
      createExtension: PropTypes.func.isRequired,
      deleteExtension: PropTypes.func.isRequired,
      getEditorInterface: PropTypes.func.isRequired,
      updateEditorInterface: PropTypes.func.isRequired
    }).isRequired,
    contentTypes: PropTypes.arrayOf(
      PropTypes.shape({
        sys: PropTypes.shape({
          id: PropTypes.string.isRequired
        }),
        name: PropTypes.string.isRequired
      })
    ).isRequired
  };

  constructor(props) {
    super(props);

    this.state = {
      selectedContentTypeId: EMPTY_OPTION,
      installed: props.app.installed,
      config: cloneDeep(props.app.config)
    };
  }

  render() {
    return (
      <Workbench>
        {this.renderHeader()}
        {this.renderContent()}
      </Workbench>
    );
  }

  renderHeader() {
    const { installed, busy, selectedContentTypeId: id } = this.state;
    const validContentTypeSelected = typeof id === 'string' && id.length > 0 && id !== EMPTY_OPTION;

    return (
      <Workbench.Header>
        <Workbench.Header.Back to="^.list" />
        <Workbench.Icon>
          <AppIcon appId="basicApprovalWorkflow" />
        </Workbench.Icon>
        <Workbench.Title>App: {this.props.app.title}</Workbench.Title>
        <Workbench.Header.Actions>
          {installed && (
            <Button
              buttonType="muted"
              disabled={busy}
              loading={busy}
              onClick={this.onUninstallClick}>
              Uninstall
            </Button>
          )}
          {!installed && (
            <Button
              buttonType="positive"
              disabled={busy || !validContentTypeSelected}
              loading={busy}
              onClick={this.onInstallClick}>
              Save
            </Button>
          )}
        </Workbench.Header.Actions>
      </Workbench.Header>
    );
  }

  onInstallClick = async () => {
    this.setState({ busy: true });

    try {
      const uie = await fetchExtension(UIE_GH_URL);
      const createdUie = await this.props.cmaClient.createExtension({
        sys: { id: 'basic-approval-workflow' },
        extension: { ...uie, name: 'Reviews App' }
      });

      const { selectedContentTypeId } = this.state;
      const ct = this.props.contentTypes.find(ct => ct.sys.id === selectedContentTypeId);
      const ei = await this.props.cmaClient.getEditorInterface(ct.sys.id);

      await this.props.cmaClient.updateEditorInterface({
        sys: {
          contentType: { sys: { id: ct.sys.id } },
          version: ei.sys.version
        },
        controls: ei.controls,
        sidebar: makeSidebar(createdUie.sys.id)
      });

      const config = {
        contentTypeId: ct.sys.id,
        extensionId: createdUie.sys.id
      };

      this.props.client.save('basicApprovalWorkflow', config);
      this.setState({ installed: true, config });
      Analytics.track('approval:installed');
      Notification.success('The app was successfully installed!');
    } catch (err) {
      Notification.error('There was an error while installing the app. Try again.');
    }

    this.setState({ busy: false });
  };

  onUninstallClick = async () => {
    this.setState({ busy: true });

    try {
      await this.props.cmaClient.deleteExtension(this.state.config.extensionId);
    } catch (err) {
      // Failed to remove the extension, most likely it was already deleted.
      // Ignore and try to at least clean up the Editor Interface.
    }

    try {
      const { contentTypeId } = this.state.config;
      const ei = await this.props.cmaClient.getEditorInterface(contentTypeId);

      await this.props.cmaClient.updateEditorInterface({
        sys: {
          contentType: { sys: { id: contentTypeId } },
          version: ei.sys.version
        },
        controls: ei.controls,
        sidebar: undefined
      });

      this.props.client.remove('basicApprovalWorkflow');
      this.setState({ installed: false, config: {} });
      Analytics.track('approval:uninstalled');
      Notification.success('The app was successfully uninstalled!');
    } catch (err) {
      Notification.error('There was an error while uninstalling the app. Try again.');
    }

    this.setState({ busy: false });
  };

  renderContent() {
    const contentType = this.props.contentTypes.find(
      ct => ct.sys.id === this.state.config.contentTypeId
    );

    return (
      <Workbench.Content centered>
        <Note className={styles.section}>
          Let us know how we can improve the Basic approval workflow app.{' '}
          <FeedbackButton target="extensibility" about="Basic approval workflow app" />
        </Note>

        <Typography>
          <Heading>About</Heading>
          <Paragraph>
            This app enables an approval workflow for publishing entries. Under the hood we will
            install a UI Extension and assign it to the sidebar of the chosen content type.
          </Paragraph>
        </Typography>

        {this.state.installed && (
          <Typography>
            <Heading>The app is installed</Heading>
            {contentType && (
              <Paragraph>
                Approval workflow is enabled in entries of <strong>{contentType.name}</strong>{' '}
                content type.
              </Paragraph>
            )}
            {!contentType && (
              <Paragraph>
                We’ve got configuration for the app stored but the content type seems to be gone.
                Uninstall the app and configure it again for some other content type.
              </Paragraph>
            )}
            <Paragraph>
              If you’ll decide to uninstall the app, we will remove the UI Extension and restore the
              default sidebar for your content type. Review history and all comments will be deleted
              as well. Content type and its entries won’t be affected.
            </Paragraph>
          </Typography>
        )}

        {!this.state.installed && (
          <Typography>
            <Heading>Select a content type</Heading>
            <Paragraph>
              Pick a content type for which you want to enable the approval workflow.
            </Paragraph>
            <Select onChange={e => this.setState({ selectedContentTypeId: e.target.value })}>
              <Option key={EMPTY_OPTION} value={EMPTY_OPTION}>
                Pick a content type
              </Option>
              {this.props.contentTypes.map(ct => (
                <Option key={ct.sys.id} value={ct.sys.id}>
                  {ct.name}
                </Option>
              ))}
            </Select>
          </Typography>
        )}
      </Workbench.Content>
    );
  }
}
