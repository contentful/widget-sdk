import React, { Component } from 'react';
import _ from 'lodash';
import {
  Button,
  CheckboxField,
  FieldGroup,
  Form,
  Heading,
  ModalConfirm,
  ModalLauncher,
  Notification,
  Paragraph,
  TextField,
} from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { ContentPreviewFormSkeleton } from './skeletons/ContentPreviewFormSkeleton';
import { validate } from './ContentPreviewFormValidation';
import { slugify } from '@contentful/field-editor-slug';
import { getContentPreview } from './services/getContentPreview';
import * as Analytics from 'analytics/Analytics';
import { RouteNavigateFn, withRouteNavigate } from 'core/react-routing';
import { UnsavedChangesModalProps } from 'core/hooks';
import { ContentTypeField } from 'core/services/SpaceEnvContext/types';
import { UnsavedChangesBlocker } from 'app/common/UnsavedChangesDialog';

const styles = {
  removeButton: css({
    marginRight: tokens.spacingM,
  }),
};

type InitialValue = {
  id?: string;
  name: string;
  description?: string;
  version?: number;
  configs: {
    contentType: string;
    enabled: boolean;
    name: string;
    url: string;
    contentTypeFields: ContentTypeField[];
  }[];
};

type Props = {
  isNew: boolean;
  navigate: RouteNavigateFn;
  initialValue: InitialValue;
} & UnsavedChangesModalProps;

type State = {
  preview: InitialValue;
  errors: { name?: string; description?: string; [key: string]: string | undefined };
  busy: boolean;
  dirty: boolean;
};

class ContentPreviewFormPageWithNavigate extends Component<Props, State> {
  constructor(props) {
    super(props);

    this.state = {
      preview: {
        name: '',
        description: '',
        configs: [],
        ...props.initialValue,
      },
      errors: {},
      busy: false,
      dirty: false,
    };
  }

  componentDidMount() {
    this.props.registerSaveAction(this.save);
    this.props.setDirty(false);
  }

  validate() {
    const errors = validate(this.state.preview.name, this.state.preview.configs);

    if (errors.length > 0) {
      this.setState((state) => {
        let newState = { ...state };
        errors.forEach((item) => {
          if (item.type === 'contentType') {
            newState = {
              ...newState,
              errors: {
                ...newState.errors,
                // @ts-expect-error supress contentType is missing in item
                [`config-${item.contentType}`]: item.error,
              },
            };
          } else if (item.type === 'name') {
            newState = {
              ...newState,
              errors: {
                ...newState.errors,
                name: item.error,
              },
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
    return getContentPreview()
      .remove({
        id: this.state.preview.id,
      })
      .then(() => {
        Notification.success('Content preview was deleted successfully');
        this.props.setDirty(false);
        Analytics.track('content_preview:deleted', {
          name: this.state.preview.name,
          id: this.state.preview.id,
        });
        this.props.navigate({ path: 'content_preview.list' });
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
    const contentPreview = getContentPreview();
    return contentPreview[action](this.state.preview).then(
      (env) => {
        this.updateField('version', env.sys.version);

        Notification.success('Content preview "' + env.name + '" saved successfully');

        this.setState({ busy: false, dirty: false });
        this.props.setDirty(false);

        if (this.props.isNew) {
          Analytics.track('content_preview:created', {
            name: env.name,
            id: env.sys.id,
            isDiscoveryApp: false,
          });
        } else {
          Analytics.track('content_preview:updated', {
            name: env.name,
            id: env.sys.id,
          });
        }

        // redirect if it's new
        if (this.props.isNew) {
          this.props.navigate({ path: 'content_preview.detail', contentPreviewId: env.sys.id });
        }
      },
      (err) => {
        this.setState({ busy: false });
        const defaultMessage = 'Could not save Preview Environment';
        const serverMessage = _.first(_.split(_.get(err, 'body.message'), '\n'));
        Notification.error(serverMessage || defaultMessage);
      }
    );
  };

  updateConfig = (contentType, field, value) => {
    this.setState(
      (state) => {
        return {
          dirty: true,
          preview: {
            ...state.preview,
            configs: state.preview.configs.map((config) => {
              if (config.contentType !== contentType) {
                return config;
              }
              return {
                ...config,
                [field]: value,
              };
            }),
          },
        };
      },
      () => {
        this.props.setDirty(true);
      }
    );
  };

  updateField = (field, value) => {
    this.setState(
      (state) => ({
        ...state,
        dirty: true,
        preview: {
          ...state.preview,
          [field]: value,
        },
      }),
      () => {
        this.props.setDirty(true);
      }
    );
  };

  updateError = (field, value) => {
    this.setState((state) => ({
      ...state,
      errors: {
        ...state.errors,
        [field]: value,
      },
    }));
  };

  render() {
    return (
      <ContentPreviewFormSkeleton
        title={this.state.preview.name || 'Untitled'}
        actions={
          <React.Fragment>
            {!this.props.isNew && (
              <Button
                testId="delete-content-preview"
                className={styles.removeButton}
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
          </React.Fragment>
        }>
        {this.state.dirty && <UnsavedChangesBlocker when save={this.save} />}

        <Form className="content-preview-editor">
          <Heading className="section-title" element="h3">
            General information
          </Heading>
          <TextField
            required
            name="previewName"
            id="previewName"
            labelText="Name"
            testId="preview-name-field"
            value={this.state.preview.name}
            validationMessage={this.state.errors.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
              this.updateField('description', e.target.value);
              this.updateError('description', '');
            }}
            labelText="Description"
          />
          <Heading className="section-title" element="h3">
            Content preview URLs
          </Heading>
          <Paragraph>
            Activate the content preview and specify a custom URL for every content type that should
            display it. Use the tokens documented on the right to include specific field values of
            your entries.
          </Paragraph>
          <FieldGroup data-test-id="config-group">
            {this.state.preview.configs.map((config) => {
              const placeholder = `Preview URL for content type '${
                config.name
              }'. E.g. http://www.yourwebsite.com/${slugify(
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
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
                        placeholder,
                      }}
                      value={config.url}
                      validationMessage={this.state.errors[`config-${config.contentType}`]}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
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
      </ContentPreviewFormSkeleton>
    );
  }
}

export const ContentPreviewFormPage = withRouteNavigate(ContentPreviewFormPageWithNavigate);