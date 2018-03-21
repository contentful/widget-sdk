import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';

const Step2 = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    submit: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      templates: [],
      spaceName: '',
      selectedTemplate: null
    };
  },
  render: function () {
    const {spaceName} = this.state;

    return h('div', null,
      h('div', {className: 'cfnext-form__field'},
        h('label', {htmlor: 'space-name'}, 'Space name'),
        h('input', {
          type: 'text',
          className: 'cfnext-form__input',
          placeholder: 'Space name',
          name: 'space-name',
          value: spaceName,
          onChange: (e) => this.setSpaceName(e.target.value)
        })
      ),
      h('button', {
        className: 'button btn-action',
        onClick: this.submit
      }, 'CREATE SPACE')
    );
  },
  setSpaceName: function (spaceName) {
    const {templates} = this.state;
    this.setState({templates, spaceName});
  },
  submit: function () {
    const {submit} = this.props;
    const {spaceName, selectedTemplate} = this.state;
    submit({spaceName, template: selectedTemplate});
  }
});

export default Step2;
