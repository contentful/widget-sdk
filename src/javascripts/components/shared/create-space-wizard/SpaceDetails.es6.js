import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import TemplateSelector from './TemplateSelector';

const SpaceDetails = createReactClass({
  propTypes: {
    submit: PropTypes.func.isRequired,
    spaceRatePlan: PropTypes.object.isRequired,
    serverValidationErrors: PropTypes.object,
    isFormSubmitted: PropTypes.bool,
    onDimensionsChange: PropTypes.func
  },
  getInitialState: function () {
    const state = {
      name: '',
      template: null,
      touched: false
    };
    state.validation = validateState(state);
    return state;
  },
  componentWillReceiveProps: function ({serverValidationErrors}) {
    if (serverValidationErrors !== this.props.serverValidationErrors) {
      this.setState({validation: serverValidationErrors});
    }
  },
  render: function () {
    const {spaceRatePlan, isFormSubmitted, onDimensionsChange} = this.props;
    const {name, validation, touched} = this.state;
    const showValidationError = touched && !!validation.name;

    return (
      <div>
        <h2 className="create-space-wizard__heading">
          Choose a name
        </h2>
        <p className="create-space-wizard__subheading">
          You are about to create a {spaceRatePlan.name.toLowerCase()} space
          for ${spaceRatePlan.price}/month.
        </p>
        <div className="cfnext-form__field create-space-wizard__centered-block">
          <label htmlor="space-name">
            Space name
            <span className="cfnext-form__label-hint">(required)</span>
          </label>
          <input
            type="text"
            className="cfnext-form__input"
            placeholder="Space name"
            name="name"
            required=""
            value={name}
            onChange={(e) => this.setName(e.target.value)}
            aria-invalid={showValidationError}
            style={{width: '400px'}} />
          {showValidationError && (
            <p className="cfnext-form__field-error">{validation.name}</p>
          )}
        </div>
        <TemplateSelector
          onSelect={this.setTemplate}
          onDimensionsChange={onDimensionsChange}
        />
        <div style={{textAlign: 'center', margin: '1.2em 0'}}>
          <button
            className={`button btn-action ${isFormSubmitted ? 'is-loading' : ''}`}
            disabled={isFormSubmitted || Object.keys(validation).length}
            onClick={this.submit}>
            Create the space
          </button>
        </div>
      </div>
    );
  },
  setName: function (name) {
    const state = {name, touched: true};
    state.validation = validateState(state);
    this.setState(state);
  },
  setTemplate: function (template) {
    this.setState({template, touched: true});
  },
  submit: function () {
    const validation = validateState(this.state);
    this.setState({validation});

    if (!Object.keys(validation).length) {
      const {name, template} = this.state;
      this.props.submit({spaceName: name, template});
    }
  }
});

function validateState ({name}) {
  const validation = {};
  if (!name) {
    validation.name = 'Name is required';
  }
  return validation;
}

export default SpaceDetails;
