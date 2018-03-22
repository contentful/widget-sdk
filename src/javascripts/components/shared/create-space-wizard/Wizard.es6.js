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
      organization: {},
      spaceRatePlan: {},
      spaceName: '',
      template: null,
      serverValidationErrors: null
    };
  },
  componentWillMount: async function () {
    const organization = await TokenStore.getOrganization(this.props.orgId);
    this.setState(Object.assign(this.state, {organization}));
  },
  render: function () {
    const {orgId, cancel} = this.props;
    const {step, organization, spaceRatePlan, serverValidationErrors} = this.state;

    return h('div', {className: 'modal-dialog'},
      h('div', {className: 'modal-dialog__header', style: {padding: 0}},
        h(Navigation, {
          steps: [
            {id: '1', label: 'Space type', isEnabled: true},
            {id: '2', label: 'Space details', isEnabled: !!spaceRatePlan}
          ],
          currentStep: step,
          navigate: (step) => this.setState(Object.assign(this.state, {step}))
        }),
        h('button', {
          className: 'create-space-wizard-dialog__close modal-dialog__close',
          onClick: cancel
        })
      ),
      h('div', {className: 'modal-dialog__content'},
        h('div', {style: {display: step === '1' ? 'block' : 'none'}},
          h(Step1, {
            orgId,
            organization,
            submit: this.submitStep1
          })
        ),
        h('div', {style: {display: step === '2' ? 'block' : 'none'}},
          h(Step2, {
            orgId,
            spaceRatePlan: spaceRatePlan,
            serverValidationErrors,
            submit: this.submitStep2
          })
        )
      )
    );
  },
  submitStep1: function ({spaceRatePlan}) {
    this.setState(Object.assign(this.state, {spaceRatePlan, step: '2'}));
  },
  submitStep2: async function ({spaceName, template}) {
    // eslint-disable-next-line no-console
    console.log(template);

    const state = Object.assign(this.state, {spaceName, template});
    const spaceData = makeSpaceData(state);
    let newSpace;

    try {
      newSpace = await client.createSpace(spaceData, this.props.orgId);
    } catch (error) {
      this.handleError(error);
    }
    if (newSpace) {
      await TokenStore.refresh();
      this.props.onSpaceCreated(newSpace);
    }
  },
  handleError: function (error) {
    logger.logServerWarn('Could not create Space', {error});

    const serverValidationErrors = getFieldErrors(error);
    if (Object.keys(serverValidationErrors).length) {
      this.setState(Object.assign(this.state, {serverValidationErrors}));
    } else {
      notification.error('Could not create Space. If the problem persists please get in contact with us.');
      this.props.cancel();
    }
  }
});

function makeSpaceData ({spaceRatePlan, spaceName}) {
  return {
    defaultLocale: 'en-US',
    productRatePlanId: get(spaceRatePlan, 'sys.id'),
    name: spaceName
  };
}

function getFieldErrors (error) {
  const errors = get(error, 'body.details.errors') || [];

  return errors.reduce((acc, err) => {
    let message;
    if (err.path === 'name' && err.name === 'length') {
      message = 'Space name is too long';
    } else {
      message = `Value "${err.value}" is invalid`;
    }
    acc[err.path] = message;
    return acc;
  }, {});
}

function Navigation ({steps, currentStep, navigate}) {
  return h('ul', {className: 'tab-list'},
    steps.map(({id, label, isEnabled}) => h('li', {
      key: id,
      role: 'tab',
      'aria-selected': id === currentStep
    },
      h('button', {
        onClick: () => navigate(id),
        disabled: !isEnabled
      }, label)
    ))
  );
}

export default Wizard;
