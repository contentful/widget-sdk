import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import {Steps} from './WizardUtils';
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
import * as auth from 'Authentication';
import {apiUrl} from 'Config';
import {createSpaceEndpoint} from 'data/Endpoint';
import createApiKeyRepo from 'data/CMA/ApiKeyRepo';

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
    action: PropTypes.string.isRequired,
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
        spaceRatePlan: null,
        spaceName: '',
        template: null,
        serverValidationErrors: null
      }
    };
  },
  render () {
    const {
      space,
      action,
      organization,
      onCancel,
      onConfirm,
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
              onConfirm={onConfirm}
              onDimensionsChange={onDimensionsChange}
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
        onClick={onCancel} />;

      const stepProps = {
        ...data,
        organization,
        space,
        action,
        isFormSubmitted,
        serverValidationErrors,
        onDimensionsChange,
        onCancel,
        onNavigate: this.navigate,
        onChange: this.setStateData,
        onSubmit: this.goToNextStep
      };

      return (
        <div className="modal-dialog create-space-wizard" style={{width: '750px'}}>
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
  navigate (stepId) {
    this.setState({currentStepId: stepId});
  },
  setStateData (stepData) {
    this.setState({
      data: {...this.state.data, ...stepData},
      isFormSubmitted: false,
      serverValidationErrors: null
    });
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
      this.setState({currentStepId: getNextStep(steps, currentStepId)});
    }
  },

  async createSpace () {
    const {organization, onSpaceCreated, onTemplateCreated} = this.props;
    const spaceData = makeSpaceData(this.state.data);
    let newSpace;

    this.setState({isFormSubmitted: true});

    try {
      newSpace = await client.createSpace(spaceData, organization.sys.id);
    } catch (error) {
      this.handleError(error);
    }
    if (newSpace) {
      const spaceEndpoint = createSpaceEndpoint(apiUrl(), newSpace.sys.id, auth);
      const apiKeyRepo = createApiKeyRepo(spaceEndpoint);

      await TokenStore.refresh();

      onSpaceCreated(newSpace);

      const {template} = this.state.data;

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
        this.props.onConfirm();
      }
    }
  },

  async changeSpace () {
    const { space } = this.props;

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

    this.props.onConfirm();
  },

  handleError (error) {
    logger.logServerWarn('Could not create Space', {error});

    const serverValidationErrors = getFieldErrors(error);
    if (Object.keys(serverValidationErrors).length) {
      this.setState({serverValidationErrors, currentStepId: 1});
    } else {
      notification.error('Could not create Space. If the problem persists please get in contact with us.');
      this.props.onCancel();
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

function makeSpaceData ({spaceRatePlan, spaceName}) {
  return {
    defaultLocale: DEFAULT_LOCALE,
    productRatePlanId: get(spaceRatePlan, 'sys.id'),
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

export default Wizard;
