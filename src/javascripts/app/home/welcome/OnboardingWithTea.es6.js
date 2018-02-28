import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import TEASteps, { STEPS_KEYS } from './OnboardingWithTeaSteps';
import { getStore } from 'TheStore';
import spaceContext from 'spaceContext';
import {track} from 'analytics/Analytics';
import $state from '$state';

const GROUP_ID = 'tea_onboarding_steps';

const store = getStore('local');

/**
 * Since we don't use normal ES6 classes, it means we can't assign element
 * to `this` in the constructor (we don't have one).
 * So we create constants every time we need them
 * @returns {Object} - object with all constants
*/
function getProgressConstants () {
  const spaceId = spaceContext.getId();

  return {
    viewContent: createProgressConstant({ id: spaceId, text: STEPS_KEYS.VIEW_SAMPLE_CONTENT }),
    viewPreview: createProgressConstant({ id: spaceId, text: STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP }),
    createEntry: createProgressConstant({ id: spaceId, text: STEPS_KEYS.CREATE_ENTRY }),
    viewGithub: createProgressConstant({ id: spaceId, text: STEPS_KEYS.GET_REPO })
  };
}

// function to generate progress names in unified way
function createProgressConstant ({ id, text }) {
  return `ctfl:${id}:progressTEA:${text}`;
}

/**
 * Function to convert truthy/falsy value to 0/1
 * @param {any} value - truthy/falsy value
 * @returns {Number} - 0/1, depending on the value
 */
function boolToNumber (value) {
  return Number(Boolean(value));
}


const OnboardingWithTea = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  getInitialState () {
    const constants = getProgressConstants();
    return {
      [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: { isDone: store.get(constants.viewContent) || false },
      [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: { isDone: store.get(constants.viewPreview) || false },
      [STEPS_KEYS.CREATE_ENTRY]: { isDone: store.get(constants.createEntry) || false },
      [STEPS_KEYS.GET_REPO]: { isDone: store.get(constants.viewGithub) || false },
      [STEPS_KEYS.INVITE_DEV]: { isDone: false }
    };
  },
  componentDidMount () {
    spaceContext.endpoint({
      method: 'GET',
      path: ['users']
    }).then((res) => {
      this.setState({
        [STEPS_KEYS.INVITE_DEV]: { isDone: res.items.length > 1 }
      });
    });
  },
  countProgress () {
    return [
      this.state[STEPS_KEYS.VIEW_SAMPLE_CONTENT].isDone,
      this.state[STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP].isDone,
      this.state[STEPS_KEYS.CREATE_ENTRY].isDone,
      this.state[STEPS_KEYS.GET_REPO].isDone || this.state[STEPS_KEYS.INVITE_DEV].isDone
    ].reduce((acc, value) => {
      return acc + boolToNumber(value);
    }, 0);
  },
  viewContent () {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'view_content',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    store.set(constants.viewContent, true);
    this.setState({
      [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: { isDone: true }
    });
  },
  viewPreview () {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'view_preview',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    store.set(constants.viewPreview, true);
    this.setState({
      [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: { isDone: true }
    });
  },
  createEntry () {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'create_entry',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    store.set(constants.createEntry, true);
    this.setState({
      [STEPS_KEYS.CREATE_ENTRY]: { isDone: true }
    });
  },
  getRepo () {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'get_repo',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    store.set(constants.viewGithub, true);
    this.setState({
      [STEPS_KEYS.GET_REPO]: { isDone: true }
    });
  },
  render () {
    const progress = this.countProgress();
    const stepsProps = {
      orgId: this.props.orgId,
      state: this.state,
      actions: {
        [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: this.viewContent,
        [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: this.viewPreview,
        [STEPS_KEYS.CREATE_ENTRY]: this.createEntry,
        [STEPS_KEYS.GET_REPO]: this.getRepo
      }
    };
    return (
      <section className='home-section tea-onboarding'>
        <Header progress={progress} />
        <TEASteps {...stepsProps} />
      </section>
    );
  }
});

const Header = createReactClass({
  propTypes: {
    progress: PropTypes.number.isRequired
  },
  render () {
    return (
      <div className='tea-onboarding__header'>
        <h2 className='tea-onboarding__heading'>Welcome to your space home</h2>
        <Progress count={this.props.progress} total={4} />
      </div>
    );
  }
});

const Progress = createReactClass({
  propTypes: {
    count: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  },
  render () {
    const { count, total } = this.props;
    return (
      <span>
        {`${count}/${total} steps completed`}
      </span>
    );
  }
});

export default OnboardingWithTea;
