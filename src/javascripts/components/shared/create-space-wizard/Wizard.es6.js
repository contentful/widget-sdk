import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Step1 from './Step1';
import Step2 from './Step2';
import {get} from 'lodash';
import client from 'client';
import * as TokenStore from 'services/TokenStore';
import notification from 'notification';
import logger from 'logger';

const Wizard = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    cancel: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      step: '1',
      spaceData: {
        defaultLocale: 'en-US',
        productRatePlanId: null,
        name: ''
      },
      template: null
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
    const spaceData = Object.assign(this.state.spaceData, {
      productRatePlanId: get(spacePlan, 'sys.id')
    });
    if (spaceData.productRatePlanId) {
      this.setState({
        spaceData,
        template: null,
        step: '2'
      });
    }
  },
  submitStep2: async function ({spaceName, template}) {
    const spaceData = Object.assign(this.state.spaceData, {
      name: spaceName
    });

    const newSpace = await createNewSpace({
      data: spaceData,
      orgId: this.props.orgId,
      template
    });

    if (newSpace) {
      this.props.onSpaceCreated(newSpace);
    }
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

async function createNewSpace ({data, orgId}) {
  let newSpace;
  try {
    newSpace = await client.createSpace(data, orgId);
  } catch (error) {
    // const errors = get(error, 'body.details.errors');
    notification.error('Could not create Space. If the problem persists please get in contact with us.');
    logger.logServerWarn('Could not create Space', {error: error});
  }
  if (newSpace) {
    await TokenStore.refresh();
  }
  return newSpace;
}


export default Wizard;
