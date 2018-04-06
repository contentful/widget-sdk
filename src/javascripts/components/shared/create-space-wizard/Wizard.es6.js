import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import classnames from 'classnames';
import SpacePlanSelector from './SpacePlanSelector';
import SpaceDetails from './SpaceDetails';
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

const Wizard = createReactClass({
  propTypes: {
    organization: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired
      }).isRequired,
      name: PropTypes.string.isRequired,
      isBillable: PropTypes.bool
    }).isRequired,
    cancel: PropTypes.func.isRequired,
    confirm: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired,
    onTemplateCreated: PropTypes.func.isRequired,
    // call back to Angular directive to readjust modal position
    onDimensionsChange: PropTypes.func
  },
  getInitialState () {
    return {
      currentStepId: 0,
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
  steps: [
    {
      label: '1. Space type',
      isEnabled: () => true,
      component: SpacePlanSelector
    },
    {
      label: '2. Space details',
      isEnabled: (data) => !!data.spaceRatePlan,
      component: SpaceDetails
    }
  ],
  render () {
    const {organization, cancel, confirm, onDimensionsChange} = this.props;
    const {currentStepId, isFormSubmitted, isSpaceCreated, isContentCreated, data} = this.state;

    if (isSpaceCreated) {
      return (
        <div className="modal-dialog" style={{width: '750px'}}>
          <div className="modal-dialog__content">
            <ProgressScreen
              done={isContentCreated}
              confirm={confirm}
              onDimensionsChange={onDimensionsChange}
            />
          </div>
        </div>
      );
    } else {
      const navigation = (
        <ul className="tab-list">
          {this.steps.map(({label, isEnabled}, id) => (
            <li key={id} role="tab" aria-selected={id === currentStepId}>
              <button onClick={this.navigate(id)} disabled={!isEnabled(data)}>
                {label}
              </button>
            </li>
          ))}
        </ul>
      );
      const closeButton = <button
        className="create-space-wizard__close modal-dialog__close"
        onClick={cancel} />;

      const stepProps = {
        ...data,
        organization,
        isFormSubmitted,
        onDimensionsChange,
        cancel,
        submit: this.submitStep
      };

      return (
        <div className="modal-dialog create-space-wizard" style={{width: '750px'}}>
          <div className="modal-dialog__header create-space-wizard__navigation" style={{padding: 0}}>
            {navigation}
            {closeButton}
          </div>
          <div className="modal-dialog__content">
            {this.steps.map(({isEnabled, component}, id) => {
              const isCurrent = (id === currentStepId);
              return (
                <div
                  key={id}
                  className={classnames('create-space-wizard__step', {
                    'create-space-wizard__step--current': isCurrent
                  })}>
                  {isEnabled(stepProps) && React.createElement(component, stepProps)}
                </div>
              );
            })}
          </div>
        </div>
      );
    }
  },
  navigate (stepId) {
    return () => this.setState({currentStepId: stepId});
  },
  submitStep (stepData) {
    let {currentStepId, data} = this.state;
    data = Object.assign(data, stepData);

    if (currentStepId === this.steps.length - 1) {
      this.createSpace(data);
    } else {
      currentStepId = currentStepId + 1;
    }
    this.setState({
      data,
      currentStepId,
      serverValidationErrors: null
    });
  },
  async createSpace (data) {
    const {organization, onSpaceCreated, onTemplateCreated} = this.props;
    const spaceData = makeSpaceData(data);
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
        this.props.confirm();
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
