import React from 'react';
import PropTypes from 'prop-types';
import { TEASteps, STEPS_KEYS } from './OnboardingWithTeaSteps.es6';
import { getStore } from 'TheStore/index.es6';
import { track, updateUserInSegment } from 'analytics/Analytics.es6';
import { findKey, omit, times } from 'lodash';
import { getModule } from 'NgRegistry.es6';

const spaceContext = getModule('spaceContext');
const $state = getModule('$state');

const GROUP_ID = 'tea_onboarding_steps';

const store = getStore('local');

/**
 * Since we don't use normal ES6 classes, it means we can't assign element
 * to `this` in the constructor (we don't have one).
 * So we create constants every time we need them
 * @returns {Object} - object with all constants
 */
function getProgressConstants() {
  const spaceId = spaceContext.getId();

  return {
    viewContent: createProgressConstant({ spaceId, text: STEPS_KEYS.VIEW_SAMPLE_CONTENT }),
    viewPreview: createProgressConstant({ spaceId, text: STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP }),
    createEntry: createProgressConstant({ spaceId, text: STEPS_KEYS.CREATE_ENTRY }),
    viewGithub: createProgressConstant({ spaceId, text: STEPS_KEYS.GET_REPO })
  };
}

// function to generate progress names in unified way
function createProgressConstant({ spaceId, text }) {
  return `ctfl:${spaceId}:progressTEA:${text}`;
}

/**
 * Function to convert truthy/falsy value to 0/1
 * @param {any} value - truthy/falsy value
 * @returns {Number} - 0/1, depending on the value
 */
function boolToNumber(value) {
  return Number(Boolean(value));
}

export default class OnboardingWithTea extends React.Component {
  constructor(props, context) {
    super(props, context);
    const constants = getProgressConstants();
    const state = {
      [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: { isDone: store.get(constants.viewContent) || false },
      [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: { isDone: store.get(constants.viewPreview) || false },
      [STEPS_KEYS.CREATE_ENTRY]: { isDone: store.get(constants.createEntry) || false },
      [STEPS_KEYS.INVITE_DEV]: { isDone: false }
    };
    const stepToExpand = this.getOpenQuestion(state);

    this.state = {
      expanded: stepToExpand,
      ...state
    };
  }

  componentDidMount() {
    spaceContext
      .endpoint({
        method: 'GET',
        path: ['users']
      })
      .then(res => {
        this.setState({
          [STEPS_KEYS.INVITE_DEV]: { isDone: res.items.length > 1 }
        });
      });
  }

  getOpenQuestion = state => {
    return findKey(state, ({ isDone }) => !isDone);
  };

  markAsDone = newState => {
    const steps = omit(
      {
        ...this.state,
        ...newState
      },
      'expanded'
    );
    const stepToExpand = this.getOpenQuestion(steps);

    this.setState({
      ...newState,
      expanded: stepToExpand
    });
  };

  countProgress = () => {
    return [
      this.state[STEPS_KEYS.VIEW_SAMPLE_CONTENT].isDone,
      this.state[STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP].isDone,
      this.state[STEPS_KEYS.CREATE_ENTRY].isDone,
      this.state[STEPS_KEYS.INVITE_DEV].isDone
    ].reduce((acc, value) => {
      return acc + boolToNumber(value);
    }, 0);
  };

  viewContent = () => {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'view_content',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    // track in intercom
    updateUserInSegment({
      teaOnboardingViewedContent: true
    });
    store.set(constants.viewContent, true);
    const spaceId = spaceContext.getId();
    // hack to pre-select course contentType filter in entry list
    const contentKey = `lastFilterQueryString.entries.${spaceId}`;
    store.set(contentKey, { contentTypeId: 'course' });
    this.markAsDone({
      [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: { isDone: true }
    });
  };

  viewPreview = () => {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'view_preview',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    // track in intercom
    updateUserInSegment({
      teaOnboardingViewedPreview: true
    });
    store.set(constants.viewPreview, true);
    this.markAsDone({
      [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: { isDone: true }
    });
  };

  createEntry = () => {
    const constants = getProgressConstants();
    track('element:click', {
      elementId: 'create_entry',
      groupId: GROUP_ID,
      fromState: $state.current.name
    });
    // track in intercom
    updateUserInSegment({
      teaOnboardingCreatedEntry: true
    });
    store.set(constants.createEntry, true);
    this.markAsDone({
      [STEPS_KEYS.CREATE_ENTRY]: { isDone: true }
    });
  };

  inviteDev = () => {
    const orgId = spaceContext.space.getOrganizationId();
    const spaceId = spaceContext.space.getId();
    const inviteTrackingKey = `ctfl:${orgId}:progressTEA:inviteDevTracking`;
    store.set(inviteTrackingKey, { spaceId });
  };

  toggleExpanding = key => {
    const { expanded } = this.state;
    this.setState({
      // if we toggle currently open one, just close it
      expanded: key === expanded ? null : key
    });
  };

  render() {
    const progress = this.countProgress();
    const stepsProps = {
      state: this.state,
      actions: {
        [STEPS_KEYS.VIEW_SAMPLE_CONTENT]: this.viewContent,
        [STEPS_KEYS.PREVIEW_USING_EXAMPLE_APP]: this.viewPreview,
        [STEPS_KEYS.CREATE_ENTRY]: this.createEntry,
        [STEPS_KEYS.INVITE_DEV]: this.inviteDev
      },
      toggleExpanding: this.toggleExpanding
    };
    return (
      <section className="home-section tea-onboarding">
        <Header>
          <h3 className="tea-onboarding__heading">Explore the content of an Education App</h3>
          <Progress count={progress} total={4} />
        </Header>
        <TEASteps {...stepsProps} />
      </section>
    );
  }
}

export class Header extends React.Component {
  static propTypes = {
    children: PropTypes.node.isRequired
  };

  render() {
    return <div className="tea-onboarding__header">{this.props.children}</div>;
  }
}

export class Progress extends React.Component {
  static propTypes = {
    count: PropTypes.number.isRequired,
    total: PropTypes.number.isRequired
  };

  render() {
    const { count, total } = this.props;
    const pills = times(total, index => {
      const activeClass = index >= count ? '' : 'tea-onboarding__pill-active';
      return <div key={index} className={`tea-onboarding__pill ${activeClass}`} />;
    });
    return (
      <div className={'tea-onboarding__progress'}>
        <div className={'tea-onboarding__pills'}>{pills}</div>
        {`${count}/${total} steps completed`}
      </div>
    );
  }
}
