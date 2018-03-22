import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import {get} from 'lodash';

const Step2 = createReactClass({
  propTypes: {
    submit: PropTypes.func.isRequired,
    spaceRatePlan: PropTypes.object.isRequired,
    serverValidationErrors: PropTypes.object
  },
  getInitialState: function () {
    const state = {
      templates: [],
      name: '',
      selectedTemplate: null,
      touched: false
    };
    state.validation = validateState(state);
    return state;
  },
  componentWillReceiveProps: function ({serverValidationErrors}) {
    if (serverValidationErrors !== this.props.serverValidationErrors) {
      this.setState(Object.assign(this.state, {
        validation: serverValidationErrors
      }));
    }
  },
  render: function () {
    const {spaceRatePlan} = this.props;
    const {name, validation, touched} = this.state;
    const showValidationError = touched && !!validation.name;

    return h('div', null,
      h('h2', {className: 'create-space-wizard-dialog__heading'}, 'Choose a name'),
      h('p', {className: 'create-space-wizard-dialog__subheading'},
        `You are about to create a ${shortenPlanName(spaceRatePlan.name)} space for $${spaceRatePlan.price}/month.`
      ),
      h('div', {className: 'cfnext-form__field'},
        h('label', {htmlor: 'space-name'}, 'Space name',
          h('span', {className: 'cfnext-form__label-hint'}, '(required)')
        ),
        h('input', {
          type: 'text',
          className: 'cfnext-form__input',
          placeholder: 'Space name',
          name: 'name',
          required: '',
          value: name,
          onChange: (e) => this.setName(e.target.value),
          'aria-invalid': showValidationError,
          style: {width: '400px'}
        }),
        showValidationError && h('p', {className: 'cfnext-form__field-error'}, validation.name)
      ),
      h('button', {
        className: 'button btn-action',
        disabled: Object.keys(validation).length,
        onClick: this.submit
      }, 'Create the space')
    );
  },
  setName: function (name) {
    this.setState(Object.assign(this.state, {name, touched: true}));
    this.validate();
  },
  submit: function () {
    this.validate();
    const {validation, name, selectedTemplate} = this.state;
    if (Object.keys(validation).length) {
      return;
    }
    this.props.submit({spaceName: name, template: selectedTemplate});
  },
  validate: function () {
    this.setState(
      Object.assign(this.state, {validation: validateState(this.state)})
    );
  }
});

function validateState ({name}) {
  const validation = {};
  if (!name) {
    validation.name = 'Name is required';
  }
  return validation;
}

function shortenPlanName (name = '') {
  const shortName = get(/^\s*Space Plan[\s-]*(\w*)\s*$/.exec(name), 1);
  return (shortName || name).toLowerCase();
}

export default Step2;
