import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import {
  Heading,
  Paragraph,
  Button,
  Notification,
  Note,
  TextLink
} from '@contentful/forma-36-react-components';
import { getWebhookRepo } from 'app/settings/webhooks/services/WebhookRepoInstance';
import { Workbench } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import ModalLauncher from 'app/common/ModalLauncher';
import FeedbackButton from 'app/common/FeedbackButton';
import AppUninstallDialog from '../dialogs/AppUninstallDialog';
import AppIcon from '../_common/AppIcon';

import { cloneDeep } from 'lodash';

import * as Analytics from 'analytics/Analytics';

import Setup from './Setup';
import SelectContent, { SELECT_CONTENT_TYPE } from './SelectContent';
import DraftRecordModal, { SELECT_LOCALE } from './DraftRecordModal';
import APIKeyModal from './APIKeyModal';
import * as Webhooks from './Webhooks';
import * as Intercom from 'services/intercom';
import * as Navigator from 'states/Navigator';

const DEFAULT_NEW_RECORD = {
  isNewRecord: true,
  index: '',
  localeCode: '',
  contentTypeId: '',
  fields: {
    default: true
  }
};

const notifyError = (err, fallbackMessage) => {
  Notification.error(err.useMessage ? err.message || fallbackMessage : fallbackMessage);
};

const styles = {
  algoliaCta: css({
    marginLeft: tokens.spacingM
  })
};

export default class AlgoliaAppPage extends Component {
  static propTypes = {
    app: PropTypes.shape({
      id: PropTypes.string.isRequired,
      title: PropTypes.string.isRequired,
      installed: PropTypes.bool.isRequired,
      config: PropTypes.object.isRequired
    }).isRequired,
    allContentTypes: PropTypes.arrayOf(PropTypes.object).isRequired,
    allWebhooks: PropTypes.arrayOf(PropTypes.object).isRequired,
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
      config: cloneDeep(props.app.config),
      isDraftModalOpen: false,
      isAPIKeyRequired: false
    };

    if (!this.state.config.records) {
      this.state.config.records = [];
    }
  }

  editDraft = () => {
    if (!this.state.draftRecord || this.state.draftRecord.contentTypeId === SELECT_CONTENT_TYPE) {
      return Notification.error('Please select a content type');
    }

    this.setState({
      isDraftModalOpen: true
    });
  };

  editRecord = configIndex => {
    if (this.state.config.records[configIndex].deleted) {
      this.onRecordFieldChange(configIndex, { deleted: false });
      return;
    }

    this.setState(
      {
        draftRecord: {
          configIndex,
          ...this.state.config.records[configIndex]
        }
      },
      this.editDraft
    );
  };

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

  onDraftPropertyChange(prop, value) {
    this.setState(({ draftRecord }) => ({ draftRecord: { ...draftRecord, [prop]: value } }));
  }

  onDraftContentTypeIdChange = contentTypeId => {
    this.setState({
      isDraftModalOpen: false,
      draftRecord: {
        ...DEFAULT_NEW_RECORD,
        contentTypeId
      }
    });
  };

  onDraftIndexChange = value => {
    this.onDraftPropertyChange('index', value);
  };

  onDraftLocaleChange = value => {
    this.onDraftPropertyChange('localeCode', value);
  };

  onDraftIsNewRecordChange = value => {
    this.onDraftPropertyChange('isNewRecord', value);
  };

  onDraftFieldsChange = value => {
    this.onDraftPropertyChange('fields', value);
  };

  onSaveDraft = () => {
    const records = cloneDeep(this.state.config.records);
    const draftRecord = cloneDeep(this.state.draftRecord);

    if (draftRecord.localeCode === SELECT_LOCALE) {
      return Notification.error('Please select a language');
    }

    if (!draftRecord.index || !draftRecord.index.trim()) {
      return Notification.error('A valid Algolia index is required');
    }

    if (draftRecord.isNewRecord) {
      records.push({
        ...draftRecord,
        isNewRecord: false,
        created: true,
        updated: false,
        deleted: false
      });
    } else {
      records[draftRecord.configIndex] = {
        ...draftRecord,
        created: draftRecord.publishWebhookId === undefined,
        updated: draftRecord.publishWebhookId !== undefined,
        deleted: false
      };
    }

    this.onConfigPropertyChange('records', records);

    this.setState({
      draftRecord: null,
      isDraftModalOpen: false,
      isAPIKeyRequired: !this.state.apiKey && !draftRecord.publishWebhookId
    });
  };

  onCancelDraft = () => {
    this.setState({ draftRecord: null, isDraftModalOpen: false });
  };

  onRecordFieldChange = (index, changes) => {
    const copy = cloneDeep(this.state.config.records);
    copy[index] = {
      ...copy[index],
      ...changes
    };

    this.onConfigPropertyChange('records', copy);
  };

  onDeleteRecord = index => {
    this.onRecordFieldChange(index, { deleted: true, created: false });
    this.setState({ draftRecord: null, isDraftModalOpen: false });
  };

  getIntegrationContext = async () => {
    const allWebhooks = await getWebhookRepo().getAll();

    return {
      installed: this.state.installed,
      apiKey: this.state.apiKey,
      config: this.state.config,
      allContentTypes: this.props.allContentTypes,
      allLocales: this.props.locales,
      allWebhooks
    };
  };

  onInstallClick = async () => {
    try {
      this.setState({ busyWith: 'install' });
      const updatedConfig = await Webhooks.create(await this.getIntegrationContext());
      await this.props.client.save(this.props.app.id, updatedConfig);
      this.setState({ busyWith: false, installed: true, config: updatedConfig });
      Notification.success('Algolia app installed successfully.');
      Analytics.track('algolia:installed');
      Intercom.trackEvent('apps-alpha-algolia-installed');
    } catch (err) {
      this.setState({ busyWith: false });
      notifyError(err, 'Failed to install Algolia app. Try again!');
    }
  };

  onUpdateClick = async () => {
    try {
      this.setState({ busyWith: 'update' });
      const updatedConfig = await Webhooks.update(await this.getIntegrationContext());
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
      await Webhooks.remove(await this.getIntegrationContext());
      await this.props.client.remove(this.props.app.id);
      Notification.success('Algolia app uninstalled successfully.');
      Analytics.track('algolia:uninstalled');
      Navigator.go({ path: '^.list' });
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

  findContentTypeById = id => {
    return this.props.allContentTypes.find(ct => ct.sys.id === id);
  };

  render() {
    const { installed, busyWith, draftRecord, isDraftModalOpen, isAPIKeyRequired } = this.state;

    return (
      <Workbench>
        <Workbench.Header
          onBack={() => {
            Navigator.go({ path: '^.list' });
          }}
          title={`App: ${this.props.app.title}`}
          icon={<AppIcon appId="algolia" />}
          actions={
            <>
              {installed && (
                <Button
                  className={styles.algoliaCta}
                  buttonType="muted"
                  disabled={!!busyWith}
                  loading={busyWith === 'uninstall'}
                  onClick={this.onUninstallClick}>
                  Uninstall
                </Button>
              )}
              {installed && (
                <Button
                  className={styles.algoliaCta}
                  buttonType="positive"
                  disabled={!!busyWith}
                  loading={busyWith === 'update'}
                  onClick={this.onUpdateClick}>
                  Save
                </Button>
              )}
              {!installed && (
                <Button
                  className={styles.algoliaCta}
                  buttonType="positive"
                  disabled={!!busyWith}
                  loading={busyWith === 'install'}
                  onClick={this.onInstallClick}>
                  Save
                </Button>
              )}
            </>
          }
        />
        <Workbench.Content type="text">
          <div>
            <Note>
              Let us know how we can improve the Algolia app.{' '}
              <FeedbackButton target="extensibility" about="Algolia app" />
            </Note>
          </div>

          <div className="algolia-app__config-section">
            <Heading>About</Heading>
            <Paragraph>
              By setting up this app the selected content type will be automatically indexed in
              Algolia.{' '}
              <TextLink
                href="https://www.contentful.com/developers/docs/extensibility/apps/algolia/"
                target="_blank"
                rel="noopener noreferrer">
                Read the docs
              </TextLink>
              .
            </Paragraph>
          </div>

          <Setup
            installed={this.state.installed}
            appId={this.state.config.appId}
            apiKey={this.state.apiKey}
            onChange={this.onCredentialsChange}
          />
          {isDraftModalOpen && draftRecord ? (
            <DraftRecordModal
              isShown={true}
              installed={this.state.installed}
              apiKey={this.state.apiKey}
              draftRecord={draftRecord}
              contentType={this.findContentTypeById(draftRecord.contentTypeId)}
              locales={this.props.locales}
              onCredentialsChange={this.onCredentialsChange}
              onIndexChange={this.onDraftIndexChange}
              onLocaleChange={this.onDraftLocaleChange}
              onFieldsChange={this.onDraftFieldsChange}
              onClose={() => this.setState({ draftRecord: null })}
              onSave={this.onSaveDraft}
              onCancel={this.onCancelDraft}
              onDelete={this.onDeleteRecord}
            />
          ) : null}
          {isAPIKeyRequired ? (
            <APIKeyModal
              apiKey={this.state.apiKey}
              onCredentialsChange={this.onCredentialsChange}
              onClose={() => this.setState({ isAPIKeyRequired: false })}
            />
          ) : null}
          <SelectContent
            findContentTypeById={this.findContentTypeById}
            allContentTypes={this.props.allContentTypes}
            locales={this.props.locales}
            draftRecord={draftRecord}
            records={this.state.config.records}
            onDraftContentTypeIdChange={this.onDraftContentTypeIdChange}
            editDraft={this.editDraft}
            editRecord={this.editRecord}
          />
        </Workbench.Content>
      </Workbench>
    );
  }
}