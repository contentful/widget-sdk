import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

const Step2 = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    submit: PropTypes.func.isRequired,
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
    const {name, validation, touched} = this.state;
    const showValidationError = touched && !!validation.name;

    return h('div', null,
      h('div', {className: 'cfnext-form__field'},
        h('label', {htmlor: 'space-name'}, 'Space name'),
        h('input', {
          type: 'text',
          className: 'cfnext-form__input',
          placeholder: 'Space name',
          name: 'name',
          required: '',
          value: name,
          onChange: (e) => this.setName(e.target.value),
          'aria-invalid': showValidationError
        }),
        showValidationError && h('p', {className: 'cfnext-form__field-error'}, validation.name)
      ),
      h('button', {
        className: 'button btn-action',
        disabled: Object.keys(validation).length,
        onClick: this.submit
      }, 'CREATE SPACE')
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
    this.props.submit({name, template: selectedTemplate});
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

export default Step2;
