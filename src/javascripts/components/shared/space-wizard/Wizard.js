import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { css } from 'emotion';
import { alnum } from 'utils/Random';
import { Steps, getFieldErrors } from './WizardUtils';
import SpacePlanSelector from './SpacePlanSelector';
import SpaceDetails from './SpaceDetails';
import ConfirmScreen from './ConfirmScreen';
import ProgressScreen from './ProgressScreen';
import { Notification, IconButton } from '@contentful/forma-36-react-components';

import { connect } from 'react-redux';

import { partnershipMeta as partnershipMetaPropType } from './PropTypes';
import * as actionCreators from 'redux/actions/spaceWizard/actionCreators';
import * as resourceActionCreators from 'redux/actions/resources/actionCreators';
import * as logger from 'services/logger';

const styles = {
  modalDialog: css({
    width: '750px',
  }),
  closeButton: css({
    padding: '18px 20px',
  }),
  createSpaceWizard: css({
    width: '780px',
  }),
  modalHeader: css({
    padding: 0,
  }),
};

const SpaceCreateSteps = [
  {
    id: Steps.SpaceCreateSteps.SpaceType,
    label: '1. Space type',
    isEnabled: () => true,
    component: SpacePlanSelector,
  },
  {
    id: Steps.SpaceCreateSteps.SpaceDetails,
    label: '2. Space details',
    isEnabled: (props) => Boolean(props.selectedPlan),
    component: SpaceDetails,
  },
  {
    id: Steps.SpaceCreateSteps.Confirmation,
    label: '3. Confirmation',
    isEnabled: (props) => Boolean(props.selectedPlan && props.newSpaceMeta.name),
    component: ConfirmScreen,
  },
];

const SpaceChangeSteps = [
  {
    id: Steps.SpaceChangeSteps.SpaceType,
    label: '1. Space type',
    isEnabled: () => true,
    component: SpacePlanSelector,
  },
  {
    id: Steps.SpaceChangeSteps.Confirmation,
    label: '2. Confirmation',
    isEnabled: (props) => Boolean(props.selectedPlan),
    component: ConfirmScreen,
  },
];

class Wizard extends React.Component {
  static propTypes = {
    organization: PropTypes.shape({
      sys: PropTypes.shape({
        id: PropTypes.string.isRequired,
      }).isRequired,
      name: PropTypes.string.isRequired,
      isBillable: PropTypes.bool,
    }).isRequired,

    // Space data as defined in spaceContext.space.data
    space: PropTypes.object,

    action: PropTypes.oneOf(['create', 'change']).isRequired,
    wizardScope: PropTypes.oneOf(['space', 'organization']).isRequired,
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
    getResourcesForSpace: PropTypes.func.isRequired,
    selectPlan: PropTypes.func.isRequired,
    setNewSpaceName: PropTypes.func.isRequired,
    setNewSpaceTemplate: PropTypes.func.isRequired,
    createSpace: PropTypes.func.isRequired,
    changeSpace: PropTypes.func.isRequired,
    track: PropTypes.func.isRequired,
    setPartnershipFields: PropTypes.func.isRequired,
    setSessionId: PropTypes.func.isRequired,

    spacePlans: PropTypes.object.isRequired,
    currentStepId: PropTypes.string.isRequired,
    newSpaceMeta: PropTypes.object.isRequired,
    subscriptionPrice: PropTypes.object.isRequired,
    spaceCreation: PropTypes.object.isRequired,
    spaceChange: PropTypes.object.isRequired,
    templates: PropTypes.object.isRequired,
    resources: PropTypes.object.isRequired,
    currentPlan: PropTypes.object,
    selectedPlan: PropTypes.object,
    partnershipMeta: partnershipMetaPropType,
    wizardSessionId: PropTypes.string,
  };

  componentDidMount() {
    const { action, organization, setSessionId } = this.props;
    const steps = getSteps(action);
    const token = alnum(16);

    setSessionId(token);
    this.track('open', {
      paymentDetailsExist: Boolean(organization.isBillable),
      wizardSessionId: token,
    });
    this.navigate(steps[0].id, token);
  }

  UNSAFE_componentWillReceiveProps = ({ spaceCreation: { error } }) => {
    const {
      spaceCreation: { error: currentError },
    } = this.props;

    const { action, onCancel, navigate } = this.props;
    const steps = getSteps(action);

    if (error && error !== currentError) {
      logger.logServerWarn(`Could not ${action} space`, { error });
      const serverValidationErrors = getFieldErrors(error);

      if (action === 'create' && Object.keys(serverValidationErrors).length) {
        navigate(steps[1].id);
      } else {
        Notification.error(
          `Could not ${action} your space. If the problem persists, get in touch with us.`
        );
        onCancel(); // close modal without tracking 'cancel' event
      }
    }
  };

  render() {
    const {
      space,
      action,
      wizardScope,
      organization,
      onCancel,
      onDimensionsChange,
      spacePlans,
      fetchSpacePlans,
      fetchSubscriptionPrice,
      fetchTemplates,
      getResourcesForSpace,
      resources,
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
      partnershipMeta,
    } = this.props;

    const steps = getSteps(action);
    const { template } = newSpaceMeta;

    if (spaceCreation.success && template) {
      return (
        <div className={`modal-dialog ${styles.modalDialog}`}>
          <div className="modal-dialog__content">
            <ProgressScreen done={!spaceCreation.isPending} onConfirm={this.confirm} />
          </div>
        </div>
      );
    } else {
      const navigation = (
        <ul className="create-space-wizard__navigation">
          {steps.map(({ id, label, isEnabled }) => (
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
      const closeButton = (
        <IconButton
          iconProps={{ icon: 'Close' }}
          label="Close modal dialog"
          onClick={this.cancel}
          buttonType="muted"
          testId="modal-dialog-close"
          className={styles.closeButton}
        />
      );

      const stepProps = {
        organization,
        space,
        action,
        wizardScope,
        reposition: onDimensionsChange,
        onCancel,
        track: this.track,
        onChange: this.setStateData,
        onSubmit: this.goForward,
        spacePlans,
        fetchSpacePlans,
        fetchSubscriptionPrice,
        fetchTemplates,
        getResourcesForSpace,
        resources,
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
        partnershipMeta,
      };

      return (
        <div className={`modal-dialog create-space-wizard ${styles.createSpaceWizard}`}>
          <div className={`modal-dialog__header ${styles.modalHeader}`}>
            {navigation}
            {closeButton}
          </div>
          <div className="modal-dialog__content">
            {steps.map(({ id, isEnabled, component }) => (
              <div
                key={id}
                className={classnames('create-space-wizard__step', {
                  'create-space-wizard__step--current': id === currentStepId,
                })}>
                {isEnabled(this.props) && React.createElement(component, stepProps)}
              </div>
            ))}
          </div>
        </div>
      );
    }
  }

  cancel = () => {
    const { onCancel } = this.props;

    onCancel && onCancel();
    this.track('cancel');
  };

  confirm = () => {
    const { onConfirm } = this.props;

    onConfirm && onConfirm();
  };

  track = (eventName, data) => {
    const { track, action, wizardScope, wizardSessionId } = this.props;
    const trackedData = {
      action,
      wizardSessionId,
      ...data,
      ...(wizardScope && { wizardScope }),
    };

    track(eventName, trackedData);
  };

  setStateData = (stepData) => {
    this.setState(({ data }) => ({
      data: { ...data, ...stepData },
      isFormSubmitted: false,
      serverValidationErrors: null,
    }));
  };

  navigate = (stepId, sessionId) => {
    const { navigate, currentStepId, wizardSessionId } = this.props;

    this.track('navigate', {
      currentStepId,
      targetStepId: stepId,
      wizardSessionId: wizardSessionId || sessionId,
    });
    navigate(stepId);
  };

  goForward = () => {
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
      partnershipMeta,
    } = this.props;

    const steps = getSteps(action);
    const lastStep = isLastStep(steps, currentStepId);

    if (lastStep && action === 'create') {
      createSpace({
        organization,
        selectedPlan,
        newSpaceMeta,
        onSpaceCreated,
        onTemplateCreated,
        onConfirm,
        partnershipMeta,
      });
    } else if (lastStep && action === 'change') {
      changeSpace({ space, selectedPlan, onConfirm });
    } else {
      const nextStepId = getNextStep(steps, currentStepId);

      this.navigate(nextStepId);
    }
  };

  handleError = (error) => {
    const { action, onCancel } = this.props;
    const steps = getSteps(action);

    logger.logServerWarn(`Could not ${action} space`, { error });

    const serverValidationErrors = getFieldErrors(error);

    if (action === 'create' && Object.keys(serverValidationErrors).length) {
      this.setState({
        serverValidationErrors,
        currentStepId: steps[1].id,
      });
    } else {
      Notification.error(
        `Could not ${action} your space. If the problem persists, get in touch with us.`
      );
      onCancel(); // close modal without tracking 'cancel' event
    }
  };
}

const mapStateToProps = (state) => {
  return {
    spacePlans: state.spaceWizard.spacePlans,
    templates: state.spaceWizard.templates,
    resources: state.resources,
    currentPlan: state.spaceWizard.spacePlanSelected.currentPlan,
    selectedPlan: state.spaceWizard.spacePlanSelected.selectedPlan,
    currentStepId: state.spaceWizard.currentStep,
    newSpaceMeta: state.spaceWizard.newSpaceMeta,
    subscriptionPrice: state.spaceWizard.subscriptionPrice,
    spaceCreation: state.spaceWizard.spaceCreation,
    spaceChange: state.spaceWizard.spaceChange,
    partnershipMeta: state.spaceWizard.partnershipMeta,
    wizardSessionId: state.spaceWizard.wizardSessionId,
  };
};

const mapDispatchToProps = {
  fetchSpacePlans: actionCreators.fetchSpacePlans,
  fetchSubscriptionPrice: actionCreators.fetchSubscriptionPrice,
  fetchTemplates: actionCreators.fetchTemplates,
  getResourcesForSpace: resourceActionCreators.getResourcesForSpace,
  createSpace: actionCreators.createSpace,
  changeSpace: actionCreators.changeSpace,
  selectPlan: actionCreators.selectPlan,
  navigate: actionCreators.navigate,
  track: actionCreators.track,
  setNewSpaceName: actionCreators.setNewSpaceName,
  setNewSpaceTemplate: actionCreators.setNewSpaceTemplate,
  reset: actionCreators.reset,
  sendPartnershipEmail: actionCreators.sendPartnershipEmail,
  setPartnershipFields: actionCreators.setPartnershipFields,
  setSessionId: actionCreators.setSessionId,
};

export { Wizard };
export default connect(mapStateToProps, mapDispatchToProps)(Wizard);

function getSteps(action) {
  if (action === 'create') {
    return SpaceCreateSteps;
  } else if (action === 'change') {
    return SpaceChangeSteps;
  }
}

function isLastStep(steps, stepId) {
  return steps[steps.length - 1].id === stepId;
}

function getNextStep(steps, stepId) {
  if (isLastStep(steps, stepId)) {
    return stepId;
  } else {
    const index = steps.findIndex(({ id }) => id === stepId);
    return steps[index + 1].id;
  }
}
