import React from 'react';
import createReactClass from 'create-react-class';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { Steps, getFieldErrors } from './WizardUtils';
import SpacePlanSelector from './SpacePlanSelector';
import SpaceDetails from './SpaceDetails';
import ConfirmScreen from './ConfirmScreen';
import ProgressScreen from './ProgressScreen';
import notification from 'notification';
import logger from 'logger';

import { connect } from 'react-redux';

import * as actionCreators from './store/actionCreators';
import { wrapWithDispatch } from 'utils/ReduxUtils';

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
    isEnabled: (props) => Boolean(props.selectedPlan),
    component: SpaceDetails
  },
  {
    id: Steps.SpaceCreateSteps.Confirmation,
    label: '3. Confirmation',
    isEnabled: (props) => Boolean(props.selectedPlan && props.newSpaceMeta.name),
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
    isEnabled: (props) => Boolean(props.selectedPlan),
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

    // Space data as defined in spaceContext.space.data
    space: PropTypes.object,

    // Resource object as created by ResourceService
    limitReached: PropTypes.object,

    action: PropTypes.oneOf([ 'create', 'change' ]),
    onCancel: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    onSpaceCreated: PropTypes.func.isRequired,
    onTemplateCreated: PropTypes.func.isRequired,
    // call back to Angular directive to readjust modal position
    onDimensionsChange: PropTypes.func,

    navigate: PropTypes.func.isRequired,
    fetchSpacePlans: PropTypes.func.isRequired,
    fetchSubscriptionPrice: PropTypes.func.isRequired,
    fetchTemplates: PropTypes.func.isRequired,
    selectPlan: PropTypes.func.isRequired,
    setNewSpaceName: PropTypes.func.isRequired,
    setNewSpaceTemplate: PropTypes.func.isRequired,
    createSpace: PropTypes.func.isRequired,
    changeSpace: PropTypes.func.isRequired,
    track: PropTypes.func.isRequired,
    setPartnershipFields: PropTypes.func.isRequired,

    spacePlans: PropTypes.object.isRequired,
    currentStepId: PropTypes.string.isRequired,
    newSpaceMeta: PropTypes.object.isRequired,
    subscriptionPrice: PropTypes.object.isRequired,
    spaceCreation: PropTypes.object.isRequired,
    spaceChange: PropTypes.object.isRequired,
    templates: PropTypes.object.isRequired,
    currentPlan: PropTypes.object,
    selectedPlan: PropTypes.object,
    partnershipData: PropTypes.object
  },

  componentDidMount () {
    const { navigate, action } = this.props;
    const steps = getSteps(action);

    this.track('open');

    navigate(steps[0].id);
  },

  componentWillReceiveProps ({ spaceCreation: { error } }) {
    const { spaceCreation: { error: currentError } } = this.props;

    const { action, onCancel, navigate } = this.props;
    const steps = getSteps(action);

    if (error && error !== currentError) {
      logger.logServerWarn(`Could not ${action} space`, {error});
      const serverValidationErrors = getFieldErrors(error);

      if (action === 'create' && Object.keys(serverValidationErrors).length) {
        navigate(steps[1].id);
      } else {
        notification.error(`Could not ${action} your space. If the problem persists, get in touch with us.`);
        onCancel(); // close modal without tracking 'cancel' event
      }
    }
  },

  render () {
    const {
      space,
      limitReached,
      action,
      organization,
      onCancel,
      onDimensionsChange,

      spacePlans,
      fetchSpacePlans,
      fetchSubscriptionPrice,
      fetchTemplates,
      currentPlan,
      selectedPlan,
      selectPlan,
      currentStepId,
      newSpaceMeta,
      setNewSpaceName,
      setNewSpaceTemplate,
      setPartnershipFields,
      subscriptionPrice,
      spaceCreation,
      spaceChange,
      templates,
      partnershipData
    } = this.props;

    const steps = getSteps(action);
    const { template } = newSpaceMeta;

    if (spaceCreation.success && template) {
      return (
        <div className="modal-dialog" style={{width: '750px'}}>
          <div className="modal-dialog__content">
            <ProgressScreen
              done={!spaceCreation.isPending}
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
              aria-disabled={!isEnabled(this.props)}
              onClick={() => isEnabled(this.props) && this.navigate(id)}>
              {label}
            </li>
          ))}
        </ul>
      );
      const closeButton = <button
        className="create-space-wizard__close modal-dialog__close"
        onClick={this.cancel} />;

      const stepProps = {
        organization,
        space,
        limitReached,
        action,
        reposition: onDimensionsChange,
        onCancel,
        track: this.track,
        onChange: this.setStateData,
        onSubmit: this.goForward,

        spacePlans,
        fetchSpacePlans,
        fetchSubscriptionPrice,
        fetchTemplates,
        currentPlan,
        selectedPlan,
        selectPlan,
        newSpaceMeta,
        setNewSpaceName,
        setNewSpaceTemplate,
        setPartnershipFields,
        subscriptionPrice,
        spaceCreation,
        spaceChange,
        templates,
        partnershipData
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
                {isEnabled(this.props) && React.createElement(component, stepProps)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  },

  cancel () {
    const { onCancel } = this.props;

    onCancel && onCancel();
    this.track('cancel');
  },

  confirm () {
    const { onConfirm } = this.props;

    onConfirm && onConfirm();
    this.track('confirm');
  },

  track (eventName, data = {}) {
    const { track } = this.props;

    track(eventName, data, this.props);
  },

  setStateData (stepData) {
    this.setState(({data}) => ({
      data: {...data, ...stepData},
      isFormSubmitted: false,
      serverValidationErrors: null
    }));
  },

  navigate (stepId) {
    const { navigate } = this.props;

    navigate(stepId);
    this.track('navigate', { targetStep: stepId });
  },

  goForward () {
    const {
      currentStepId,
      action,
      organization,
      space,
      selectedPlan,
      createSpace,
      changeSpace,
      newSpaceMeta,
      onSpaceCreated,
      onTemplateCreated,
      onConfirm,
      partnershipData
    } = this.props;

    const steps = getSteps(action);
    const lastStep = isLastStep(steps, currentStepId);

    if (lastStep && action === 'create') {
      createSpace({
        action,
        organization,
        currentStepId,
        selectedPlan,
        newSpaceMeta,
        onSpaceCreated,
        onTemplateCreated,
        onConfirm,
        partnershipData
      });
    } else if (lastStep && action === 'change') {
      changeSpace({ space, selectedPlan, onConfirm });
    } else {
      const nextStepId = getNextStep(steps, currentStepId);

      this.navigate(nextStepId);
    }
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

const mapStateToProps = state => {
  return {
    spacePlans: state.spaceWizard.spacePlans,
    templates: state.spaceWizard.templates,
    currentPlan: state.spaceWizard.spacePlanSelected.currentPlan,
    selectedPlan: state.spaceWizard.spacePlanSelected.selectedPlan,
    currentStepId: state.spaceWizard.currentStep,
    newSpaceMeta: state.spaceWizard.newSpaceMeta,
    subscriptionPrice: state.spaceWizard.subscriptionPrice,
    spaceCreation: state.spaceWizard.spaceCreation,
    spaceChange: state.spaceWizard.spaceChange,
    partnershipData: state.spaceWizard.partnershipData
  };
};

const mapDispatchToProps = wrapWithDispatch({
  fetchSpacePlans: actionCreators.fetchSpacePlans,
  fetchSubscriptionPrice: actionCreators.fetchSubscriptionPrice,
  fetchTemplates: actionCreators.fetchTemplates,
  createSpace: actionCreators.createSpace,
  changeSpace: actionCreators.changeSpace,
  selectPlan: actionCreators.selectPlan,
  navigate: actionCreators.navigate,
  track: actionCreators.track,
  setNewSpaceName: actionCreators.setNewSpaceName,
  setNewSpaceTemplate: actionCreators.setNewSpaceTemplate,
  reset: actionCreators.reset,
  sendPartnershipEmail: actionCreators.sendPartnershipEmail,
  setPartnershipFields: actionCreators.setPartnershipFields
});

export default connect(mapStateToProps, mapDispatchToProps)(Wizard);

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
