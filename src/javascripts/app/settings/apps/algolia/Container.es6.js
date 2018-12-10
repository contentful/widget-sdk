import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Notification, Note } from '@contentful/forma-36-react-components';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import AppUninstallDialog from '../dialogs/AppUninstallDialog.es6';
import AppsFeedback from '../AppsFeedback.es6';
import AppIcon from '../_common/AppIcon.es6';

import { cloneDeep } from 'lodash';

import $state from '$state';
import * as Analytics from 'analytics/Analytics.es6';
import intercom from 'intercom';

import Setup from './Setup.es6';
import Select from './Select.es6';
import Configure from './Configure.es6';
import * as Webhooks from './Webhooks.es6';

const notifyError = (err, fallbackMessage) => {
  Notification.error(err.useMessage ? err.message || fallbackMessage : fallbackMessage);
};

export default class AlgoliaAppPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    contentTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
    locales: PropTypes.arrayOf(PropTypes.object).isRequired,
    client: PropTypes.shape({
      save: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired
    }).isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      installed: props.app.installed,
      config: cloneDeep(props.app.config)
    };
  }

  onConfigPropertyChange = (prop, value) => {
    this.setState(({ config }) => ({ config: { ...config, [prop]: value } }));
  };

  onCredentialsChange = ({ appId, apiKey }) => {
    if (appId) {
      this.onConfigPropertyChange('appId', appId);
    }
    if (apiKey) {
      this.setState({ apiKey });
    }
  };

  onIndexChange = value => this.onConfigPropertyChange('index', value);
  onLocaleCodeChange = value => this.onConfigPropertyChange('localeCode', value);
  onContentTypeIdChange = value => this.onConfigPropertyChange('contentTypeId', value);

  getIntegrationContext = () => {
    return {
      installed: this.state.installed,
      apiKey: this.state.apiKey,
      config: this.state.config,
      contentTypes: this.props.contentTypes,
      locales: this.props.locales
    };
  };

  onInstallClick = async () => {
    try {
      this.setState({ busyWith: 'install' });
      const updatedConfig = await Webhooks.create(this.getIntegrationContext());
      await this.props.client.save(this.props.app.id, updatedConfig);
      this.setState({ busyWith: false, installed: true, config: updatedConfig });
      Notification.success('Algolia app installed successfully.');
      Analytics.track('algolia:installed');
      intercom.trackEvent('apps-alpha-algolia-installed');
    } catch (err) {
      this.setState({ busyWith: false });
      notifyError(err, 'Failed to install Algolia app. Try again!');
    }
  };

  onUpdateClick = async () => {
    try {
      this.setState({ busyWith: 'update' });
      const updatedConfig = await Webhooks.update(this.getIntegrationContext());
      await this.props.client.save(this.props.app.id, updatedConfig);
      this.setState({ busyWith: false, config: updatedConfig });
      Notification.success('Algolia app configuration updated successfully.');
      Analytics.track('algolia:updated');
    } catch (err) {
      this.setState({ busyWith: false });
      notifyError(err, 'Failed to update Algolia app. Try again!');
    }
  };

  uninstall = async () => {
    try {
      this.setState({ busyWith: 'uninstall' });
      await Webhooks.remove(this.getIntegrationContext());
      await this.props.client.remove(this.props.app.id);
      Notification.success('Algolia app uninstalled successfully.');
      Analytics.track('algolia:uninstalled');
      $state.go('^.list');
    } catch (err) {
      this.setState({ busyWith: false });
      notifyError(err, 'Failed to uninstall Algolia app. Try again!');
    }
  };

  onUninstallClick = async () => {
    const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
      <AppUninstallDialog
        app={this.props.app}
        isShown={isShown}
        onCancel={() => onClose(false)}
        onConfirm={() => onClose(true)}
      />
    ));

    if (confirmed) {
      this.uninstall();
    }
  };

  render() {
    const { installed, busyWith } = this.state;

    return (
      <Workbench>
        <Workbench.Header>
          <Workbench.Header.Back to="^.list" />
          <Workbench.Icon>
            <AppIcon appId="algolia" />
          </Workbench.Icon>
          <Workbench.Title>Apps: {this.props.app.title}</Workbench.Title>
          <Workbench.Header.Actions>
            {installed && (
              <Button
                buttonType="muted"
                disabled={!!busyWith}
                loading={busyWith === 'uninstall'}
                onClick={this.onUninstallClick}>
                Uninstall
              </Button>
            )}
            {installed && (
              <Button
                buttonType="positive"
                disabled={!!busyWith}
                loading={busyWith === 'update'}
                onClick={this.onUpdateClick}>
                Update
              </Button>
            )}
            {!installed && (
              <Button
                buttonType="positive"
                disabled={!!busyWith}
                loading={busyWith === 'install'}
                onClick={this.onInstallClick}>
                Install
              </Button>
            )}
          </Workbench.Header.Actions>
        </Workbench.Header>
        <Workbench.Content centered>
          <Note>
            Let us know how we can improve the Algolia app. <AppsFeedback about="Algolia app" />
          </Note>
          <div>
            <h3>About</h3>
            <p>
              By setting up this app the selected content type will be automatically indexed in
              Algolia.{' '}
              <a
                href="https://www.contentful.com/developers/docs/extensibility/apps/algolia/"
                target="_blank"
                rel="noopener noreferrer">
                Read the docs
              </a>
              .
            </p>
          </div>
          <Setup
            installed={this.state.installed}
            appId={this.state.config.appId}
            apiKey={this.state.apiKey}
            onChange={this.onCredentialsChange}
          />
          <Select
            selectedContentTypeId={this.state.config.contentTypeId}
            contentTypes={this.props.contentTypes}
            onChange={this.onContentTypeIdChange}
          />
          <Configure
            index={this.state.config.index}
            localeCode={this.state.config.localeCode}
            locales={this.props.locales}
            onLocaleCodeChange={this.onLocaleCodeChange}
            onIndexChange={this.onIndexChange}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}
