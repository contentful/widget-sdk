import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import TemplateSelector from './TemplateSelector';
import { formatPrice, getFieldErrors } from './WizardUtils';

const SpaceDetails = createReactClass({
  propTypes: {
    track: PropTypes.func.isRequired,
    onChange: PropTypes.func.isRequired,
    onSubmit: PropTypes.func.isRequired,
    selectedPlan: PropTypes.object.isRequired,
    serverValidationErrors: PropTypes.object,
    isFormSubmitted: PropTypes.bool,
    setNewSpaceName: PropTypes.func.isRequired,
    setNewSpaceTemplate: PropTypes.func.isRequired,
    templates: PropTypes.object.isRequired,
    fetchTemplates: PropTypes.func.isRequired,
    spaceCreation: PropTypes.object.isRequired
  },
  getInitialState: function() {
    const state = {
      name: '',
      template: null,
      touched: false
    };
    state.validation = validateState(state);
    return state;
  },
  componentWillReceiveProps: function({ spaceCreation: { error } }) {
    const {
      spaceCreation: { error: currentError }
    } = this.props;

    if (error && error !== currentError) {
      const fieldErrors = getFieldErrors(error);

      this.setState({ validation: fieldErrors });
    }
  },
  render: function() {
    const { selectedPlan, templates, fetchTemplates } = this.props;
    const { validation, touched } = this.state;
    const showValidationError = touched && !!validation.name;

    return (
      <div>
        <h2 className="create-space-wizard__heading">Choose a name</h2>
        <p className="create-space-wizard__subheading">
          You are about to create a {selectedPlan.name.toLowerCase()} space for{' '}
          {formatPrice(selectedPlan.price)}
          /month.
        </p>
        <div className="cfnext-form__field create-space-wizard__centered-block">
          <label htmlor="space-name">
            Space name
            <span className="cfnext-form__label-hint">(required)</span>
          </label>
          <input
            type="text"
            className="cfnext-form__input"
            data-test-id="space-name"
            placeholder="Space name"
            name="name"
            required=""
            autoFocus
            onChange={e => this.setName(e.target.value)}
            aria-invalid={showValidationError}
            style={{ width: '400px' }}
          />
          {showValidationError && <p className="cfnext-form__field-error">{validation.name}</p>}
        </div>
        <TemplateSelector
          onSelect={this.setTemplate}
          templates={templates}
          fetchTemplates={fetchTemplates}
        />
        <div style={{ textAlign: 'center', margin: '1.2em 0' }}>
          <button
            className="button btn-primary-action"
            data-test-id="space-details-confirm"
            disabled={Object.keys(validation).length > 0}
            onClick={this.submit}>
            Proceed to confirmation
          </button>
        </div>
      </div>
    );
  },
  setName: function(name) {
    const { setNewSpaceName } = this.props;

    const nameState = { name, touched: true };
    nameState.validation = validateState(nameState);

    setNewSpaceName(name.trim());
    this.setState(nameState);
  },
  setTemplate: function(template) {
    const { setNewSpaceTemplate } = this.props;

    setNewSpaceTemplate(template);
    this.setState({ template, touched: true });
  },
  submit: function() {
    const { onSubmit, track } = this.props;

    const validation = validateState(this.state);
    this.setState({ validation });

    const { name: newSpaceName, template: newSpaceTemplate } = this.state;

    if (!Object.keys(validation).length) {
      track('entered_details', {
        newSpaceName,
        newSpaceTemplate
      });
      onSubmit();
    }
  }
});

function validateState({ name = '' }) {
  const validation = {};

  if (!name.trim()) {
    validation.name = 'Name is required';
  }

  return validation;
}

export default SpaceDetails;
