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
import {getTemplate} from 'services/SpaceTemplateLoader';
import {getCreator as getTemplateCreator} from 'services/SpaceTemplateCreator';
import spaceContext from 'spaceContext';

const DEFAULT_LOCALE = 'en-US';

const WizardSteps = [
  {
    id: Steps.SpaceType,
    label: '1. Space type',
    isEnabled: () => true,
    component: SpacePlanSelector
  },
  {
    id: Steps.SpaceDetails,
    label: '2. Space details',
    isEnabled: (props) => !!props.spaceRatePlan,
    component: SpaceDetails
  },
  {
    id: Steps.Confirmation,
    label: '3. Confirmation',
    isEnabled: (props) => !!(props.spaceRatePlan && props.spaceName),
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
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired,
    onTemplateCreated: PropTypes.func.isRequired,
    // call back to Angular directive to readjust modal position
    onDimensionsChange: PropTypes.func
  },
  getInitialState () {
    return {
      currentStepId: Steps.SpaceType,
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
    const {organization, onCancel, onConfirm, onDimensionsChange} = this.props;
    const {
      currentStepId,
      isFormSubmitted,
      isSpaceCreated,
      isContentCreated,
      data,
      serverValidationErrors
    } = this.state;

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
        <ul className="tab-list">
          {WizardSteps.map(({id, label, isEnabled}) => (
            <li key={id} role="tab" aria-selected={id === currentStepId}>
              <button onClick={() => this.navigate(id)} disabled={!isEnabled(data)}>
                {label}
              </button>
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
          <div className="modal-dialog__header create-space-wizard__navigation" style={{padding: 0}}>
            {navigation}
            {closeButton}
          </div>
          <div className="modal-dialog__content">
            {WizardSteps.map(({id, isEnabled, component}) => (
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
      serverValidationErrors: null
    });
  },
  goToNextStep () {
    const {currentStepId} = this.state;

    if (isLastStep(currentStepId)) {
      this.createSpace();
    } else {
      this.setState({currentStepId: getNextStep(currentStepId)});
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
        this.props.onConfirm();
      }
    }
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

function isLastStep (stepId) {
  return WizardSteps[WizardSteps.length - 1].id === stepId;
}

function getNextStep (stepId) {
  if (isLastStep(stepId)) {
    return stepId;
  } else {
    const index = WizardSteps.findIndex(({id}) => id === stepId);
    return WizardSteps[index + 1].id;
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
