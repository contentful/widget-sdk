import {createElement as h} from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Step1 from './Step1';
import Step2 from './Step2';
import {get, noop} from 'lodash';
import client from 'client';
import * as TokenStore from 'services/TokenStore';
import notification from 'notification';
import logger from 'logger';
import {getTemplate} from 'services/SpaceTemplateLoader';
import {getCreator as getTemplateCreator} from 'services/SpaceTemplateCreator';
import spaceContext from 'spaceContext';

const DEFAULT_LOCALE = 'en-US';

const Wizard = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    cancel: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired,
    onTemplateCreated: PropTypes.func.isRequired
  },
  getInitialState: function () {
    return {
      step: 'step1',
      organization: null,
      spaceRatePlan: null,
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

    return h('div', {
      className: 'modal-dialog',
      style: {
        width: '750px'
      }
    },
      h('div', {className: 'modal-dialog__header', style: {padding: 0}},
        h(Navigation, {
          steps: [
            {id: 'step1', label: 'Space type', isEnabled: true},
            {id: 'step2', label: 'Space details', isEnabled: !!spaceRatePlan}
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
        organization && h('div', {style: {display: step === 'step1' ? 'block' : 'none'}},
          h(Step1, {
            orgId,
            organization,
            submit: this.submitStep1
          })
        ),
        spaceRatePlan && h('div', {style: {display: step === 'step2' ? 'block' : 'none'}},
          h(Step2, {
            orgId,
            spaceRatePlan: spaceRatePlan,
            serverValidationErrors,
            submit: this.submitStep2
          })
        ),
        h('div', {style: {display: step === 'waiting' ? 'block' : 'none'}},
          'Hang tight...'
        )
      )
    );
  },
  submitStep1: function ({spaceRatePlan}) {
    this.setState(Object.assign(this.state, {spaceRatePlan, step: 'step2'}));
  },
  submitStep2: async function ({spaceName, template}) {
    const state = Object.assign(this.state, {spaceName, template});
    const spaceData = makeSpaceData(state);
    let newSpace;

    this.setState(Object.assign(this.state, {step: 'waiting'}));

    try {
      newSpace = await client.createSpace(spaceData, this.props.orgId);
    } catch (error) {
      this.handleError(error);
    }
    if (newSpace) {
      await TokenStore.refresh();
      this.props.onSpaceCreated(newSpace);

      if (template) {
        await createTemplate(template);
        await spaceContext.publishedCTs.refresh();
        this.props.onTemplateCreated();
      }
    }
  },
  handleError: function (error) {
    logger.logServerWarn('Could not create Space', {error});

    const serverValidationErrors = getFieldErrors(error);
    if (Object.keys(serverValidationErrors).length) {
      this.setState(Object.assign(this.state, {step: 'step2', serverValidationErrors}));
    } else {
      notification.error('Could not create Space. If the problem persists please get in contact with us.');
      this.props.cancel();
    }
  }
});

function makeSpaceData ({spaceRatePlan, spaceName}) {
  return {
    defaultLocale: DEFAULT_LOCALE,
    productRatePlanId: get(spaceRatePlan, 'sys.id'),
    name: spaceName
  };
}

function createTemplate (templateInfo) {
  const templateCreator = getTemplateCreator(
    spaceContext,
    // TODO add analytics tracking
    {onItemSuccess: noop, onItemError: noop},
    templateInfo,
    DEFAULT_LOCALE
  );

  return getTemplate(templateInfo)
    .then((templateData) => tryCreateTemplate(templateCreator, templateData));
}

function tryCreateTemplate (templateCreator, templateData, retried) {
  const {spaceSetup, contentCreated} = templateCreator.create(templateData);

  // we suppress errors, since `contentCreated` will handle them
  // We need to catch all errors, because http requests
  // are backed by $q, and we have global handlers on
  // $q errors
  spaceSetup.catch(noop);

  return contentCreated.catch((data) => {
    if (!retried) {
      return tryCreateTemplate(templateCreator, data.template, true);
    }
  });
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
