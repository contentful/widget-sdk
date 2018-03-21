import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Step1 from './Step1';
import Step2 from './Step2';

const Wizard = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      step: '1'
    };
  },
  render: function () {
    const {orgId, cancel} = this.props;
    const {step} = this.state;

    const gotoStep = (step) => { this.setState({step}); };

    return h('div', {className: 'create-new-space-dialog modal-dialog'},
      h('div', {className: 'modal-dialog__header create-new-space-dialog__header'},
        h('button', {className: 'create-new-space-dialog__close modal-dialog__close',
          onClick: cancel
        })
      ),
      h('ul', null,
        h('li', null, h('button', {onClick: () => gotoStep('1')}, ['step 1'])),
        h('li', null, h('button', {onClick: () => gotoStep('2')}, ['step 2']))
      ),
      step === '1' && h(Step1, {orgId}),
      step === '2' && h(Step2, {orgId})
    );
  }
});

export default Wizard;
