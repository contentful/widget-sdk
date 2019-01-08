import React, { Component } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import {
  Button,
  Form,
  TextField,
  FieldGroup,
  CheckboxField,
  Notification,
  ModalConfirm
} from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import validate from './ContentPreviewFormValidation.es6';
import Workbench from 'app/common/Workbench.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import {
  WhatIsContentPreview,
  TokensForContentPreview,
  LinkedEntries,
  LegacyTokens
} from './ContentPreviewSidebar.es6';

const $state = getModule('$state');
const contentPreview = getModule('contentPreview');
const Analytics = getModule('analytics/Analytics.es6');
const slugUtils = getModule('slug');

export const ContentPreviewFormPageSkeleton = props => (
  <Workbench>
    <Workbench.Header>
      <Workbench.Header.Back to="^.list" />
      <Workbench.Icon icon="page-settings" />
      {props.header}
    </Workbench.Header>
    <Workbench.Content>{props.children}</Workbench.Content>
    <Workbench.Sidebar className="content-preview-sidebar">
      <WhatIsContentPreview />
      <TokensForContentPreview />
      <LinkedEntries />
      <LegacyTokens />
    </Workbench.Sidebar>
  </Workbench>
);
ContentPreviewFormPageSkeleton.propTypes = {
  header: PropTypes.node,
  children: PropTypes.node
};

export default class ContentPreviewFormPage extends Component {
  static propTypes = {
    isNew: PropTypes.bool.isRequired,
    registerSaveAction: PropTypes.func.isRequired,
    setDirty: PropTypes.func.isRequired,
    initialValue: PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string.isRequired,
      description: PropTypes.string,
      version: PropTypes.number,
      configs: PropTypes.arrayOf(
        PropTypes.shape({
          contentType: PropTypes.string.isRequired,
          enabled: PropTypes.bool.isRequired,
          name: PropTypes.string.isRequired,
          url: PropTypes.string.isRequired,
          contentTypeFields: PropTypes.arrayOf(PropTypes.object).isRequired
        }).isRequired
      ).isRequired
    })
  };

  constructor(props) {
    super(props);

    this.state = {
      preview: {
        name: '',
        description: '',
        configs: [],
        ...props.initialValue
      },
      errors: {},
      busy: false,
      dirty: false
    };
  }

  componentDidMount() {
    this.props.registerSaveAction(this.save);
    this.props.setDirty(false);
  }

  validate() {
    const errors = validate(this.state.preview.name, this.state.preview.configs);

    if (errors.length > 0) {
      this.setState(state => {
        let newState = { ...state };
        errors.forEach(item => {
          if (item.type === 'contentType') {
            newState = {
              ...newState,
              errors: {
                ...newState.errors,
                [`config-${item.contentType}`]: item.error
              }
            };
          } else if (item.type === 'name') {
            newState = {
              ...newState,
              errors: {
                ...newState.errors,
                name: item.error
              }
            };
          }
        });
        return newState;
      });
      return false;
    }
    return true;
  }

  remove = async () => {
    const confirmed = await ModalLauncher.open(({ isShown, onClose }) => (
      <ModalConfirm
        isShown={isShown}
        title="Are you sure?"
        intent="negative"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        confirmTestId="confirm-delete-content-preview"
        onCancel={() => onClose(false)}
        onConfirm={() => onClose(true)}>
        Are you sure you want to delete the content preview{' '}
        <strong>{this.state.preview.name}</strong>?
      </ModalConfirm>
    ));

    if (!confirmed) {
      return;
    }

    this.setState({ busy: true });
    return contentPreview
      .remove({
        id: this.state.preview.id
      })
      .then(() => {
        Notification.success('Content preview was deleted successfully');
        this.props.setDirty(false);
        Analytics.track('content_preview:deleted', {
          name: this.state.preview.name,
          sys: { id: this.state.preview.id }
        });
        $state.go('^.list');
      })
      .catch(() => {
        Notification.error('An error occurred');
      });
  };

  save = () => {
    const isValid = this.validate();
    if (!isValid) {
      return;
    }

    const action = this.props.isNew ? 'create' : 'update';

    this.setState({ busy: true });
    return contentPreview[action](this.state.preview).then(
      env => {
        this.updateField('version', env.sys.version);

        Notification.success('Content preview "' + env.name + '" saved successfully');

        this.setState({ busy: false, dirty: false });
        this.props.setDirty(false);

        if (this.props.isNew) {
          Analytics.track('content_preview:created', {
            envName: env.name,
            envId: env.sys.id,
            isDiscoveryApp: false
          });
        } else {
          Analytics.track('content_preview:updated', {
            envName: env.name,
            envId: env.sys.id
          });
        }

        // redirect if it's new
        if (this.props.isNew) {
          $state.go('^.detail', { contentPreviewId: env.sys.id }, { reload: true });
        }
      },
      err => {
        this.setState({ busy: false });
        const defaultMessage = 'Could not save Preview Environment';
        const serverMessage = _.first(_.split(_.get(err, 'body.message'), '\n'));
        Notification.error(serverMessage || defaultMessage);
      }
    );
  };

  updateConfig = (contentType, field, value) => {
    this.setState(
      state => {
        return {
          dirty: true,
          preview: {
            ...state.preview,
            configs: state.preview.configs.map(config => {
              if (config.contentType !== contentType) {
                return config;
              }
              return {
                ...config,
                [field]: value
              };
            })
          }
        };
      },
      () => {
        this.props.setDirty(true);
      }
    );
  };

  updateField = (field, value) => {
    this.setState(
      state => ({
        ...state,
        dirty: true,
        preview: {
          ...state.preview,
          [field]: value
        }
      }),
      () => {
        this.props.setDirty(true);
      }
    );
  };

  updateError = (field, value) => {
    this.setState(state => ({
      ...state,
      errors: {
        ...state.errors,
        [field]: value
      }
    }));
  };

  render() {
    return (
      <ContentPreviewFormPageSkeleton
        header={
          <React.Fragment>
            <Workbench.Title>{this.state.preview.name || 'Untitled'}</Workbench.Title>
            <Workbench.Header.Actions>
              {!this.props.isNew && (
                <Button
                  testId="delete-content-preview"
                  buttonType="muted"
                  onClick={this.remove}
                  loading={this.state.busy}>
                  Delete
                </Button>
              )}
              <Button
                disabled={!this.state.dirty}
                onClick={this.save}
                loading={this.state.busy}
                testId="save-content-preview"
                buttonType="positive">
                Save
              </Button>
            </Workbench.Header.Actions>
          </React.Fragment>
        }>
        <Form className="content-preview-editor">
          <h3 className="section-title">General information</h3>
          <TextField
            required
            name="previewName"
            id="previewName"
            labelText="Name"
            testId="preview-name-field"
            value={this.state.preview.name}
            validationMessage={this.state.errors.name}
            onChange={e => {
              this.updateField('name', e.target.value);
              this.updateError('name', '');
            }}
            helpText="Specifies how this content preview should be referred to in the entry editor."
          />
          <TextField
            textarea
            name="previewDescription"
            id="previewDescription"
            testId="preview-description-field"
            value={this.state.preview.description}
            validationMessage={this.state.errors.description}
            onChange={e => {
              this.updateField('description', e.target.value);
              this.updateError('description', '');
            }}
            labelText="Description"
          />
          <h3 className="section-title">Content preview URLs</h3>
          <p>
            Activate the content preview and specify a custom URL for every content type that should
            display it. Use the tokens documented on the right to include specific field values of
            your entries.
          </p>
          <FieldGroup data-test-id="config-group">
            {this.state.preview.configs.map(config => {
              const placeholder = `Preview URL for content type '${
                config.name
              }'. E.g. http://www.yourwebsite.com/${slugUtils.slugify(
                config.name,
                'en-US'
              )}/{entry_field.slug}/`;
              return (
                <div data-test-id="config-group-item" key={config.name}>
                  <CheckboxField
                    labelText={config.name}
                    id={`${config.contentType}-checkbox`}
                    name={`${config.contentType}-checkbox`}
                    checked={config.enabled}
                    onChange={e => {
                      this.updateConfig(config.contentType, 'enabled', e.target.checked);
                      this.updateError(config.contentType, '');
                    }}
                  />
                  {config.enabled && (
                    <TextField
                      id={`${config.contentType}-value`}
                      name={`${config.contentType}-value`}
                      testId={`${config.contentType}-value`}
                      labelText=""
                      textInputProps={{
                        placeholder
                      }}
                      value={config.url}
                      validationMessage={this.state.errors[`config-${config.contentType}`]}
                      onChange={e => {
                        this.updateConfig(config.contentType, 'url', e.target.value);
                        this.updateError(`config-${config.contentType}`, '');
                      }}
                    />
                  )}
                </div>
              );
            })}
          </FieldGroup>
        </Form>
      </ContentPreviewFormPageSkeleton>
    );
  }
}
