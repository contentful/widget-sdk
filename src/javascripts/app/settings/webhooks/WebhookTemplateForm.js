import React from 'react';
import PropTypes from 'prop-types';
import {
  FormLabel as Label,
  TextField,
  Button,
  Icon,
  ValidationMessage
} from '@contentful/forma-36-react-components';
import { values, isString } from 'lodash';

export class WebhookTemplateForm extends React.Component {
  static propTypes = {
    template: PropTypes.object.isRequired,
    onClose: PropTypes.func.isRequired,
    templateContentTypes: PropTypes.array.isRequired,
    onCreate: PropTypes.func.isRequired,
    hasAwsProxy: PropTypes.bool.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      busy: false,
      error: false,
      fields: props.template.fields.reduce(
        (acc, field) => ({
          ...acc,
          [field.name]: field.defaultValue || ''
        }),
        {}
      )
    };
  }

  updateFieldState = (fieldName, value) => {
    this.setState(state => ({
      ...state,
      error: false,
      fields: {
        ...state.fields,
        [fieldName]: value
      }
    }));
  };

  isFormValid(fields) {
    return values(fields).every(s => isString(s) && s.length > 0);
  }

  onCreateClick = () => {
    const { template, templateContentTypes } = this.props;
    const name = `${template.title} - ${template.subtitle}`;

    // `mapParamsToDefinition` can be a function or an array of functions.
    // The latter is useful if a template should result in many webhooks.
    const mappers = Array.isArray(template.mapParamsToDefinition)
      ? template.mapParamsToDefinition
      : [template.mapParamsToDefinition];

    this.setState({ busy: true });

    this.props
      .onCreate(
        mappers.map(mapFn => {
          return mapFn(this.state.fields, name, templateContentTypes);
        }),
        template.id
      )
      .then(() => {
        this.setState({ busy: false });
      })
      .catch(err => {
        this.setState({ busy: false, error: err.message });
      });
  };

  render() {
    const { template, templateContentTypes, hasAwsProxy } = this.props;
    const notAvailable = template.aws && !hasAwsProxy;

    return (
      <div className="webhook-template-form">
        <h2 className="webhook-template-form__title">{template.title}</h2>
        {template.description && (
          <div className="webhook-template-form__description">{template.description}</div>
        )}
        {notAvailable && (
          <div className="webhook-template-form__error">
            <ValidationMessage>Not included in your pricing plan</ValidationMessage>
            <div className="entity-editor__field-hint">
              AWS Webhook Integration is available on our enterprise-grade Professional and Scale
              platforms (via Committed, annual plans).{' '}
              <a
                href="https://www.contentful.com/support/?upgrade-pricing=true"
                target="_blank"
                rel="noopener noreferrer">
                Contact us
              </a>{' '}
              if you are interested in learning more about this feature.
            </div>
          </div>
        )}
        {template.fields.map(field => {
          // We render forms for all templates and show only one of them with CSS.
          // If there are repeated parameter names (and there are...) we cannot use
          // the name as an HTML ID. Here we add a random number to the name so
          // a chance of conflict is negligble. The only problem with conflicting IDs
          // is dev-mode React warning and not working <label>s.
          const id = field.name + Math.round(Math.random() * 99999);

          return (
            <div key={field.name} className="webhook-template-form__field">
              {['text', 'password'].includes(field.type) && (
                <TextField
                  id={id}
                  name={field.name}
                  value={this.state.fields[field.name]}
                  onChange={e => this.updateFieldState(field.name, e.target.value)}
                  required
                  labelText={field.title}
                  textInputProps={{
                    testId: `webhook-template-field--${field.name}`,
                    type: field.type,
                    placeholder: field.placeholder,
                    disabled: notAvailable
                  }}
                />
              )}
              {field.type === 'content-type-selector' && (
                <React.Fragment>
                  <Label required htmlFor={id}>
                    {field.title}
                  </Label>
                  {templateContentTypes.length > 0 && (
                    <select
                      className="cfnext-select-box"
                      data-test-id="webhook-template-field--content-type-selector"
                      id={id}
                      value={this.state.fields[field.name] || ''}
                      disabled={notAvailable}
                      onChange={e => this.updateFieldState(field.name, e.target.value)}>
                      <option value="">Select...</option>
                      {templateContentTypes.map(ct => (
                        <option key={ct.id} value={ct.id}>
                          {ct.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {templateContentTypes.length < 1 && (
                    <div className="webhook-template-form__error">
                      <ValidationMessage>
                        You need to have at least one content type with a valid title field to set
                        up a webhook with this template.
                      </ValidationMessage>
                    </div>
                  )}
                </React.Fragment>
              )}
              {field.description && (
                <div className="webhook-template-form__field-description entity-editor__field-hint">
                  {field.description}
                </div>
              )}
            </div>
          );
        })}

        <div className="webhook-template-form__notice">
          <Icon icon="ErrorCircle" color="muted" />
          All properties can be updated later.
        </div>
        {this.state.error && (
          <div className="webhook-template-form__error">
            <ValidationMessage>{this.state.error}</ValidationMessage>
          </div>
        )}
        <div className="webhook-template-form__actions">
          <Button
            testId="webhook-template-field--create-button"
            onClick={this.onCreateClick}
            disabled={!this.isFormValid(this.state.fields) || notAvailable}
            loading={this.state.busy}
            buttonType="primary">
            Create webhook
          </Button>
          <Button
            onClick={this.props.onClose}
            buttonType="muted"
            testId="webhook-template-field--cancel-button">
            Cancel
          </Button>
        </div>
      </div>
    );
  }
}

export default WebhookTemplateForm;