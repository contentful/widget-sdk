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
      step: '1',
      spaceData: {}
    };
  },
  render: function () {
    const {orgId, cancel} = this.props;
    const {step, spaceData} = this.state;

    return h('div', {className: 'create-new-space-dialog modal-dialog'},
      h('div', {className: 'modal-dialog__header create-new-space-dialog__header'},
        h('button', {className: 'create-new-space-dialog__close modal-dialog__close',
          onClick: cancel
        })
      ),
      h('div', {className: 'create-new-space-dialog__content modal-dialog__content'},
        h(Navigation, {
          steps: [
            {id: '1', label: 'Select space type', isSelected: step === '1', isEnabled: true},
            {id: '2', label: 'Create space', isSelected: step === '2', isEnabled: !!spaceData.spacePlan}
          ],
          gotoStep: (step) => this.setState({step})
        }),
        step === '1' && h(Step1, {orgId, submit: this.submitStep1}),
        step === '2' && h(Step2, {orgId, submit: this.submitStep2})
      )
    );
  },
  submitStep1: function ({spacePlan}) {
    const spaceData = Object.assign(this.state.spaceData, {spacePlan});
    this.setState({
      spaceData,
      step: '2'
    });
  },
  submitStep2: function ({spaceName, template}) {
    const spaceData = Object.assign(this.state.spaceData, {spaceName, template});
    // eslint-disable-next-line no-console
    console.log(spaceData);

    this.props.confirm();
  }
});

function Navigation ({steps, gotoStep}) {
  return h('ul', {className: 'tab-list'},
    steps.map(({id, label, isSelected, isEnabled}) => h('li', {
      key: id,
      role: 'tab',
      'aria-selected': isSelected
    },
        h('button', {
          onClick: () => gotoStep(id),
          disabled: !isEnabled
        }, label)
      )
    )
  );
}

export default Wizard;
