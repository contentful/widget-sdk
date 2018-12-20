import React from 'react';
import PropTypes from 'prop-types';
import { findKey, isObject, snakeCase } from 'lodash';
import ModifyContentStep from 'components/shared/stack-onboarding/next_steps/ModifyContentStep.es6';
import SetupWebhooksStep from 'components/shared/stack-onboarding/next_steps/SetupWebhooksStep.es6';
import NotAJSDeveloperStep from 'components/shared/stack-onboarding/next_steps/NotAJSDeveloperStep.es6';
import { getStore } from 'TheStore';
import {
  getStoragePrefix,
  getUser,
  getPerson
} from 'components/shared/auto_create_new_space/CreateModernOnboarding.es6';
import { Progress, Header } from 'app/home/welcome/OnboardingWithTea.es6';
import {
  MODIFY_CONTENT,
  SETUP_WEBHOOK,
  NOT_A_JS_DEV
} from 'components/shared/stack-onboarding/next_steps/constants.es6';

const store = getStore();

export default class DevNextSteps extends React.Component {
  constructor(props) {
    super(props);

    const prefix = getStoragePrefix();

    const onToggle = key => {
      const { expanded } = this.state;
      this.setState({
        // if we toggle currently open one, close it
        expanded: key === expanded ? null : key
      });
    };

    const { track: _track, ...rest } = props;

    const state = {
      [MODIFY_CONTENT]: {
        ...rest,
        isDone: store.get(`${prefix}:devNextSteps:${MODIFY_CONTENT}`) || false,
        onToggle
      },
      [SETUP_WEBHOOK]: {
        isDone: store.get(`${prefix}:devNextSteps:${SETUP_WEBHOOK}`) || false,
        onToggle,
        deploymentProvider: store.get(`${prefix}:deploymentProvider`)
      },
      [NOT_A_JS_DEV]: {
        isDone: store.get(`${prefix}:devNextSteps:${NOT_A_JS_DEV}`) || false
      }
    };

    this.state = {
      expanded: this.getExpandedStep(state),
      ...state
    };
  }

  checkModifyStepIntervalId = undefined;

  componentDidMount() {
    if (!this.state[MODIFY_CONTENT].isDone && !this.checkModifyStepIntervalId) {
      this.verifyModifyStep(this.props.entry);
    }
  }

  componentWillUnmount() {
    clearInterval(this.checkModifyStepIntervalId);
  }

  verifyModifyStep = async entryFromProps => {
    // We need to get current entry to compare it to user data, this is how we can know if the user had modified content
    const user = getUser();
    const entry = entryFromProps || (await getPerson());
    const isModifyStepDone = entry.fields.name['en-US'] === `${user.firstName} ${user.lastName}`;

    if (isModifyStepDone) {
      this.markAsDone(MODIFY_CONTENT);
      // If the step was done, we mark it as such and clear checkModifyStepIntervalId
      clearInterval(this.checkModifyStepIntervalId);
    }
  };

  getExpandedStep(state) {
    const { expanded: _, ...rest } = state;
    return findKey(rest, ({ isDone }) => !isDone);
  }

  setExpandedStep() {
    this.setState(state => ({
      expanded: this.getExpandedStep(state)
    }));
  }

  getProgress() {
    return Object.values(this.state)
      .filter(v => isObject(v))
      .reduce((count, { isDone }) => count + Number(Boolean(isDone)), 0);
  }

  markAsDone(step) {
    const key = `${getStoragePrefix()}:devNextSteps:${step}`;
    const isStepDone = store.get(key);

    if (!isStepDone) {
      store.set(key, true);
      this.setState(state => {
        const stateForStep = state[step];
        stateForStep.isDone = true;
        return {
          [step]: {
            ...stateForStep
          }
        };
      });
      this.setExpandedStep();
      this.props.track(snakeCase(`${step}Step`) + ':done');
    }
  }

  onCopy = key => {
    // After user copies modify content command, we start an interval to check if the user executed the command
    this.startModifyStepCheckInterval();
    this.props.track(`${snakeCase(MODIFY_CONTENT + 'Step')}:${key}`);
  };

  startModifyStepCheckInterval = () => {
    // We only start interval if modifyContentStepCompleted is false or absent
    // and checkModifyStepIntervalId is undefined
    if (!this.state[MODIFY_CONTENT].isDone && !this.checkModifyStepIntervalId) {
      this.checkModifyStepIntervalId = setInterval(this.verifyModifyStep, 5000);
    }
  };

  render() {
    const { expanded } = this.state;

    return (
      <section className="home-section tea-onboarding">
        <Header>
          <h3 className="tea-onboarding__heading">Next steps</h3>
          <Progress count={this.getProgress()} total={3} />
        </Header>
        <div className="tea-onboarding__steps">
          <ModifyContentStep
            isExpanded={expanded === MODIFY_CONTENT}
            onCopy={this.onCopy}
            {...this.state[MODIFY_CONTENT]}
          />
          <SetupWebhooksStep
            isExpanded={expanded === SETUP_WEBHOOK}
            markAsDone={_ => this.markAsDone(SETUP_WEBHOOK)}
            {...this.state[SETUP_WEBHOOK]}
          />
          <NotAJSDeveloperStep
            markAsDone={_ => this.markAsDone(NOT_A_JS_DEV)}
            {...this.state[NOT_A_JS_DEV]}
          />
        </div>
      </section>
    );
  }
}

DevNextSteps.propTypes = {
  managementToken: PropTypes.string.isRequired,
  entry: PropTypes.object.isRequired,
  spaceId: PropTypes.string.isRequired,
  track: PropTypes.func.isRequired
};
