import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {Steps, SpaceResourceTypes} from './WizardUtils';
import SpacePlanSelector from './SpacePlanSelector';
import SpaceDetails from './SpaceDetails';
import ConfirmScreen from './ConfirmScreen';
import ProgressScreen from './ProgressScreen';
import {get, noop} from 'lodash';
import client from 'client';
import * as TokenStore from 'services/TokenStore';
import notification from 'notification';
import logger from 'logger';
import {createSpaceEndpoint} from 'data/EndpointFactory';
import {getTemplate} from 'services/SpaceTemplateLoader';
import {getCreator as getTemplateCreator} from 'services/SpaceTemplateCreator';
import { changeSpace } from 'account/pricing/PricingDataProvider';
import spaceContext from 'spaceContext';
import createApiKeyRepo from 'data/CMA/ApiKeyRepo';
import * as Analytics from 'analytics/Analytics';

const DEFAULT_LOCALE = 'en-US';

const SpaceCreateSteps = [
  {
    id: Steps.SpaceCreateSteps.SpaceType,
    label: '1. Space type',
    isEnabled: () => true,
    component: SpacePlanSelector
  },
  {
    id: Steps.SpaceCreateSteps.SpaceDetails,
    label: '2. Space details',
    isEnabled: (props) => !!props.newSpaceRatePlan,
    component: SpaceDetails
  },
  {
    id: Steps.SpaceCreateSteps.Confirmation,
    label: '3. Confirmation',
    isEnabled: (props) => !!(props.newSpaceRatePlan && props.spaceName),
    component: ConfirmScreen
  }
];

const SpaceChangeSteps = [
  {
    id: Steps.SpaceChangeSteps.SpaceType,
    label: '1. Space type',
    isEnabled: () => true,
    component: SpacePlanSelector
  },
  {
    id: Steps.SpaceChangeSteps.Confirmation,
    label: '2. Confirmation',
    isEnabled: (props) => Boolean(props.newSpaceRatePlan),
    component: ConfirmScreen
  }
];

const Wizard = createReactClass({
  propTypes: {
    organization: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      name: PropTypes.string.isRequired,
      isBillable: PropTypes.bool
    }).isRequired,
    space: PropTypes.object,
    limitReached: PropTypes.shape({
      resourceType: PropTypes.oneOf(Object.values(SpaceResourceTypes)).isRequired,
      usage: PropTypes.number.isRequired
    }),
    action: function (props, propName) {
      const validActions = [ 'create', 'change' ];
      const action = props[propName];

      if (validActions.indexOf(action) === -1) {
        return new Error(`Action ${action} not valid for Wizard, expected one of ${validActions.join(', ')}`);
      }
    },
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired,
    onTemplateCreated: PropTypes.func.isRequired,
    // call back to Angular directive to readjust modal position
    onDimensionsChange: PropTypes.func
  },
  getInitialState () {
    const { action } = this.props;

    const steps = getSteps(action);

    return {
      currentStepId: steps[0].id,
      isFormSubmitted: false,
      isSpaceCreated: false,
      isContentCreated: false,
      data: {
        newSpaceRatePlan: null,
        spaceName: '',
        template: null,
        serverValidationErrors: null
      }
    };
  },
  componentDidMount () {
    this.track('open');
  },
  render () {
    const {
      space,
      limitReached,
      action,
      organization,
      onCancel,
      onDimensionsChange
    } = this.props;

    const {
      currentStepId,
      isFormSubmitted,
      isSpaceCreated,
      isContentCreated,
      data,
      serverValidationErrors
    } = this.state;

    const steps = getSteps(action);

    if (isSpaceCreated) {
      return (
        <div className="modal-dialog" style={{width: '750px'}}>
          <div className="modal-dialog__content">
            <ProgressScreen
              done={isContentCreated}
              onConfirm={this.confirm}
            />
          </div>
        </div>
      );
    } else {
      const navigation = (
        <ul className="create-space-wizard__navigation">
          {steps.map(({id, label, isEnabled}) => (
            <li
              key={id}
              data-test-id={`wizard-nav-${id}`}
              role="tab"
              aria-selected={id === currentStepId}
              aria-disabled={!isEnabled(data)}
              onClick={() => isEnabled(data) && this.navigate(id)}>
              {label}
            </li>
          ))}
        </ul>
      );
      const closeButton = <button
        className="create-space-wizard__close modal-dialog__close"
        onClick={this.cancel} />;

      const stepProps = {
        ...data,
        organization,
        space,
        limitReached,
        action,
        isFormSubmitted,
        serverValidationErrors,
        reposition: onDimensionsChange,
        onCancel,
        track: this.track,
        onChange: this.setStateData,
        onSubmit: this.goToNextStep
      };

      return (
        <div className="modal-dialog create-space-wizard" style={{width: '780px'}}>
          <div className="modal-dialog__header" style={{padding: 0}}>
            {navigation}
            {closeButton}
          </div>
          <div className="modal-dialog__content">
            {steps.map(({id, isEnabled, component}) => (
              <div
                key={id}
                className={classnames(
                  'create-space-wizard__step',
                  {
                    'create-space-wizard__step--current': id === currentStepId
                  }
                )}>
                {isEnabled(stepProps) && React.createElement(component, stepProps)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  },
  cancel () {
    this.props.onCancel();
    this.track('cancel');
  },
  confirm () {
    this.props.onConfirm();
    this.track('confirm');
  },
  track (action, data = {}) {
    track(action, {...data, ...createTrackingData(this.state, this.props)});
  },
  navigate (stepId) {
    this.setState({currentStepId: stepId});
    this.track('navigate', {targetStep: stepId});
  },
  setStateData (stepData) {
    this.setState(({data}) => ({
      data: {...data, ...stepData},
      isFormSubmitted: false,
      serverValidationErrors: null
    }));
  },
  goToNextStep () {
    const {currentStepId} = this.state;
    const { action } = this.props;

    const steps = getSteps(action);
    const lastStep = isLastStep(steps, currentStepId);

    if (lastStep && action === 'create') {
      this.createSpace();
    } else if (lastStep && action === 'change') {
      this.changeSpace();
    } else {
      const stepId = getNextStep(steps, currentStepId);

      this.setState((state, props) => {
        track('navigate', {targetStep: stepId, ...createTrackingData(state, props)});

        return {currentStepId: stepId};
      });
    }
  },

  async createSpace () {
    const {organization, onSpaceCreated, onTemplateCreated, onConfirm} = this.props;
    const {template} = this.state.data;
    const spaceData = makeSpaceData(this.state.data);
    let newSpace;

    this.setState({isFormSubmitted: true});

    try {
      newSpace = await client.createSpace(spaceData, organization.sys.id);
    } catch (error) {
      this.handleError(error);
    }

    if (newSpace) {
      const spaceEndpoint = createSpaceEndpoint(newSpace.sys.id);
      const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

      await TokenStore.refresh();

      onSpaceCreated(newSpace);

      const wizardData = createTrackingData(this.state, this.props);
      const spaceCreateEventData =
          template
          ? {templateName: template.name, entityAutomationScope: {scope: 'space_template'}, wizardData}
          : {templateName: 'Blank', wizardData};

      Analytics.track('space:create', spaceCreateEventData);


      if (template) {
        this.setState({isSpaceCreated: true});

        await createTemplate(template);
        await spaceContext.publishedCTs.refresh();

        onTemplateCreated();
        this.setState({isContentCreated: true});
      } else {
        await apiKeyRepo.create(
          'Example Key',
          'We’ve created an example API key for you to help you get started.'
        );
        onConfirm();
      }
    }
  },

  async changeSpace () {
    const { space, onConfirm } = this.props;

    this.setState({isFormSubmitted: true});

    const spaceId = space.sys.id;
    const endpoint = createSpaceEndpoint(spaceId);
    const planId = get(this.state.data, 'newSpaceRatePlan.sys.id');

    try {
      await changeSpace(endpoint, planId);
    } catch (e) {
      this.handleError(e);
      return;
    }

    onConfirm();
  },

  handleError (error) {
    const { action, onCancel } = this.props;
    const steps = getSteps(action);

    logger.logServerWarn(`Could not ${action} space`, {error});

    const serverValidationErrors = getFieldErrors(error);

    if (action === 'create' && Object.keys(serverValidationErrors).length) {
      this.setState({
        serverValidationErrors,
        currentStepId: steps[1].id
      });
    } else {
      notification.error(`Could not ${action} your space. If the problem persists, get in touch with us.`);
      onCancel(); // close modal without tracking 'cancel' event
    }
  }
});

function getSteps (action) {
  if (action === 'create') {
    return SpaceCreateSteps;
  } else if (action === 'change') {
    return SpaceChangeSteps;
  }
}

function isLastStep (steps, stepId) {
  return steps[steps.length - 1].id === stepId;
}

function getNextStep (steps, stepId) {
  if (isLastStep(steps, stepId)) {
    return stepId;
  } else {
    const index = steps.findIndex(({id}) => id === stepId);
    return steps[index + 1].id;
  }
}

function makeSpaceData ({newSpaceRatePlan, spaceName}) {
  return {
    defaultLocale: DEFAULT_LOCALE,
    productRatePlanId: get(newSpaceRatePlan, 'sys.id'),
    name: spaceName
  };
}

async function createTemplate (templateInfo) {
  const templateCreator = getTemplateCreator(
    spaceContext,
    // TODO add analytics tracking
    {onItemSuccess: noop, onItemError: noop},
    templateInfo,
    DEFAULT_LOCALE
  );

  const templateData = await getTemplate(templateInfo);
  return tryCreateTemplate(templateCreator, templateData);
}

async function tryCreateTemplate (templateCreator, templateData, retried) {
  const {spaceSetup, contentCreated} = templateCreator.create(templateData);

  try {
    await Promise.all([
      // we suppress errors, since `contentCreated` will handle them
      spaceSetup.catch(noop),
      contentCreated
    ]);
  } catch (err) {
    if (!retried) {
      await tryCreateTemplate(templateCreator, err.template, true);
    }
  }
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

function track (eventName, data) {
  // TODO: only tracking create space events until we can get currentSpaceType
  if (data.action === 'create') {
    Analytics.track(`space_wizard:${eventName}`, data);
  }
}

function createTrackingData (state, props) {
  const {action, organization} = props;
  const {currentStepId, data: {newSpaceRatePlan, spaceName, template}} = state;

  const eventData = {
    currentStep: currentStepId,
    action: action,
    paymentDetailsExist: organization.isBillable,
    spaceType: get(newSpaceRatePlan, 'internalName'),
    spaceName: spaceName,
    template: get(template, 'name')
  };

  return eventData;
}

export default Wizard;
