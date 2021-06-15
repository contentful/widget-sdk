import React from 'react';
import PropTypes from 'prop-types';
import FullScreen from 'components/shared/stack-onboarding/components/FullScreen';
import Button from '../components/Button';
import { getBrowserStorage } from 'core/services/BrowserStorage';
import { getStoragePrefix } from 'components/shared/auto_create_new_space/CreateModernOnboardingUtils';
import { updateUserInSegment, tracking, defaultEventProps } from 'analytics/Analytics';
import { FLAGS, getVariation } from 'LaunchDarkly';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import { FlexibleOnboardingDialog } from 'features/onboarding';
import { getOrganizations } from 'services/TokenStore';
import { router } from 'core/react-routing';

const store = getBrowserStorage();
class ChoiceScreen extends React.Component {
  static propTypes = {
    onContentChoice: PropTypes.func.isRequired,
    onDevChoice: PropTypes.func,
    onExperimentChoice: PropTypes.func,
  };

  state = {
    isDevPathPending: false,
    isDefaultPathPending: false,
    isGrowthExperimentEnabled: false,
    growthExperimentVariant: null,
  };

  renderBlock = ({ title, text, button }) => {
    return (
      <div className="modern-stack-onboarding--choice-block">
        <h3 className="modern-stack-onboarding--choice-block-title">{title}</h3>
        <p className="modern-stack-onboarding--choice-block-description">{text}</p>
        {button}
      </div>
    );
  };

  renderButton = ({ text, ...props }) => {
    return (
      <div className="modern-stack-onboarding--block-button-wrapper">
        <Button className="modern-stack-onboarding--block-button" {...props}>
          {text}
        </Button>
      </div>
    );
  };

  onDevChoice = async () => {
    this.setState({
      isDevPathPending: true,
    });
    if (this.state.growthExperimentVariant !== null) {
      tracking.experimentStarted({
        ...defaultEventProps(),
        experiment_id: FLAGS.EXPERIMENT_ONBOARDING_MODAL,
        experiment_variation: this.state.growthExperimentVariant
          ? 'flexible-onboarding'
          : 'control',
      });
    }
    if (this.state.isGrowthExperimentEnabled) {
      const newSpace = await this.props.onExperimentChoice();
      router.navigate({ path: 'spaces.detail.home' });
      ModalLauncher.open(({ isShown, onClose }) => {
        return (
          <FlexibleOnboardingDialog isShown={isShown} onClose={onClose} spaceId={newSpace.sys.id} />
        );
      });
    } else {
      const newSpace = await this.props.onDevChoice();
      store.set(`${getStoragePrefix()}:currentStep`, {
        path: 'spaces.detail.onboarding.getStarted',
        params: {
          spaceId: newSpace.sys.id,
        },
      });
    }
  };

  setChoiceInIntercom = (choice) => {
    updateUserInSegment({
      onboardingChoice: choice,
    });
  };

  async componentDidMount() {
    const orgs = await getOrganizations();
    const org = orgs[0];
    const newOnboardingFlag = await getVariation(FLAGS.NEW_ONBOARDING_FLOW, {
      organizationId: org.sys.id,
    });
    const newOnboardingExperimentVariation = await getVariation(FLAGS.EXPERIMENT_ONBOARDING_MODAL, {
      organizationId: org.sys.id,
    });
    this.setState({ growthExperimentVariant: newOnboardingExperimentVariation });
    const newOnboardingEnabled = newOnboardingFlag && newOnboardingExperimentVariation !== null;
    if (newOnboardingEnabled) {
      this.setState({ isGrowthExperimentEnabled: newOnboardingExperimentVariation });
    }
  }

  render() {
    const { isDefaultPathPending, isDevPathPending } = this.state;
    const { onContentChoice } = this.props;

    const isButtonDisabled = isDefaultPathPending || isDevPathPending;

    const buttonCopy = this.state.isGrowthExperimentEnabled
      ? 'Explore developer options'
      : 'Deploy a website in 3 steps';

    const contentChoice = this.renderBlock({
      title: 'I create content',
      text: 'The Contentful web-app enables you to create, manage and publish content.',
      button: this.renderButton({
        onClick: () => {
          this.setChoiceInIntercom('content');
          this.setState({ isDefaultPathPending: true });
          onContentChoice();
        },
        text: 'Explore content modeling',
        disabled: isButtonDisabled,
        isLoading: isDefaultPathPending,
        'data-test-id': 'onboarding-content-choice-btn',
      }),
    });

    const developerChoice = this.renderBlock({
      title: 'I develop content-rich products',
      text: 'Contentful enables you to manage, integrate and deliver content via APIs.',
      button: this.renderButton({
        onClick: () => {
          this.setChoiceInIntercom('developer');
          this.onDevChoice();
        },
        text: buttonCopy,
        disabled: isButtonDisabled,
        isLoading: isDevPathPending,
        'data-test-id': 'onboarding-developer-choice-btn',
      }),
    });

    return (
      <FullScreen>
        <h1 className="modern-stack-onboarding--title modern-stack-onboarding--title__margin">
          How do you usually work with content?
        </h1>
        <div
          className="modern-stack-onboarding--choice-blocks"
          data-test-id="onboarding-choice-blocks">
          {contentChoice}
          {developerChoice}
        </div>
      </FullScreen>
    );
  }
}

export default ChoiceScreen;
