import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';
import {findKey} from 'lodash';
import {go} from 'states/Navigator';

const VIEW_SAMPLE_CONTENT = 'viewSampleContent';
const PREVIEW_USING_EXAMPLE_APP = 'previewUsingExampleApp';
const CREATE_ENTRY = 'createEntry';
const GET_REPO = 'getRepo';
const INVITE_DEV = 'inviteDev';

const TEASteps = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  getInitialState () {
    return {
      [VIEW_SAMPLE_CONTENT]: { isDone: false },
      [PREVIEW_USING_EXAMPLE_APP]: { isDone: false },
      [CREATE_ENTRY]: { isDone: false },
      [GET_REPO]: { isDone: false },
      [INVITE_DEV]: { isDone: false }
    };
  },
  markAsDone (step) {
    this.setState({
      [step]: { isDone: true }
    });
  },
  render () {
    const stepToExpand = findKey(this.state, ({isDone}) => !isDone);

    return (
      <div className='tea-onboarding__steps'>
        <ViewSampleContentStep
          isExpanded={stepToExpand === VIEW_SAMPLE_CONTENT}
          {...this.state[VIEW_SAMPLE_CONTENT]}
          markAsDone={_ => this.markAsDone(VIEW_SAMPLE_CONTENT)} />
        <PreviewUsingExampleAppStep
          isExpanded={stepToExpand === PREVIEW_USING_EXAMPLE_APP}
          {...this.state[PREVIEW_USING_EXAMPLE_APP]}
          markAsDone={_ => this.markAsDone(PREVIEW_USING_EXAMPLE_APP)} />
        <CreateEntryStep
          isExpanded={stepToExpand === CREATE_ENTRY}
          {...this.state[CREATE_ENTRY]}
          markAsDone={_ => this.markAsDone(CREATE_ENTRY)} />
        <GetRepoOrInviteDevStep
          getRepo={{...this.state[GET_REPO], markAsDone: _ => this.markAsDone(GET_REPO)}}
          inviteDev={{...this.state[INVITE_DEV], markAsDone: _ => this.markAsDone(INVITE_DEV), orgId: this.props.orgId}} />
      </div>
    );
  }
});

const ViewSampleContentStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired
  },
  primaryCtaOnClick () {
    console.log(`Step ${VIEW_SAMPLE_CONTENT} done`);
    this.props.markAsDone();
  },
  render () {
    const {isDone, isExpanded} = this.props;
    const propsForStep = {
      headerCopy: 'View the sample content',
      headerIcon: 'page-ct',
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div className='tea-onboarding__step-description'>
            <p>This example space shows best practices on how to structure your content and integrate your website and app with Contentful.</p>
            <p>Have a look at the two courses composing this example.</p>
          </div>
          <button className='btn-action tea-onboarding__step-cta' onClick={e => this.primaryCtaOnClick(e)}>
            View content
          </button>
        </div>
        <div>
          <p className='tea-onboarding__step-graphic-description'>Here’s how this content is nested:</p>
          <Icon className='tea-onboarding__step-graphic' name='content-structure-graph' />
        </div>
      </Step>
    );
  }
});

const PreviewUsingExampleAppStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired
  },
  primaryCtaOnClick () {
    console.log(`Step ${PREVIEW_USING_EXAMPLE_APP} done`);
    this.props.markAsDone();
  },
  render () {
    const {isDone, isExpanded} = this.props;
    const propsForStep = {
      headerCopy: 'Preview using the example app',
      headerIcon: 'page-apis',
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div className='tea-onboarding__step-description'>
            <p>
              You can preview the two sample courses using the example app that is connected to this
              space. The app is available for multiple platforms such as JavaScript, Java, .NET and more.
            </p>
          </div>
          <button className='btn-action tea-onboarding__step-cta' onClick={e => this.primaryCtaOnClick(e)}>
            Preview content
          </button>
        </div>
        <div>
          <Icon className='tea-onboarding__step-graphic' name='tea-screenshot' />
        </div>
      </Step>
    );
  }
});

const CreateEntryStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired
  },
  primaryCtaOnClick () {
    console.log(`Step ${CREATE_ENTRY} done`);
    this.props.markAsDone();
  },
  render () {
    const {isDone, isExpanded} = this.props;
    const propsForStep = {
      headerCopy: 'Create your first entry',
      headerIcon: 'page-content',
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div className='tea-onboarding__step-description'>
            <p>
              To test it yourself, add a new copy module to a lesson. You’ll notice that a
              second language is enabled - so you can practice your German along the way!
            </p>
            <p>You can see your changes immediately using the “Open preview” button.</p>
          </div>
          <button className='btn-action tea-onboarding__step-cta' onClick={e => this.primaryCtaOnClick(e)}>
            Create entry
          </button>
        </div>
        <div>
          <p className='tea-onboarding__step-graphic-description'>Your new entry in context.</p>
          <Icon className='tea-onboarding__step-graphic' name='content-graph-highlight' />
        </div>
      </Step>
    );
  }
});

/*
orgId={this.props.orgId}
          getRepo={{...this.state[GET_REPO], markAsDone: _ => this.markAsDone(GET_REPO)}}
          inviteDev={{...this.state[INVITE_DEV], markAsDone: _ => this.markAsDone(INVITE_DEV)}}
*/
const GetRepoOrInviteDevStep = createReactClass({
  propTypes: {
    getRepo: PropTypes.shape({
      isDone: PropTypes.bool.isRequired,
      markAsDone: PropTypes.func.isRequired
    }),
    inviteDev: PropTypes.shape({
      isDone: PropTypes.bool.isRequired,
      markAsDone: PropTypes.func.isRequired,
      orgId: PropTypes.string.isRequired
    })
  },
  render () {
    return (
      <div className='tea-onboarding__split-steps'>
        <GetRepoForExampleAppStep {...this.props.getRepo} />
        <InviteADevStep {...this.props.inviteDev} />
      </div>
    );
  }
});

const GetRepoForExampleAppStep = createReactClass({
  // TODO: Handle click for view on github so that we can track things before opening
  // a new tab
  propTypes: {
    isDone: PropTypes.bool.isRequired,
    markAsDone: PropTypes.func.isRequired
  },
  handleClick () {
    this.props.markAsDone();
  },
  render () {
    const props = {
      headerCopy: 'Get repository for the example app',
      headerIcon: 'icon-github',
      isDone: this.props.isDone
    };

    return (
      <SplitStep {...props}>
        <p>Want to see the code? Find your preferred platform and clone the repository.</p>
        <a className='tea-onboarding__split-step-cta'
           href='https://github.com/contentful?utf8=%E2%9C%93&q=the-example-app&type=&language='
           target='_blank'
           rel='noopener noreferrer'
           onClick={this.handleClick}>
          View on GitHub
        </a>
      </SplitStep>
    );
  }
});

const InviteADevStep = createReactClass({
  propTypes: {
    isDone: PropTypes.bool.isRequired,
    markAsDone: PropTypes.func.isRequired,
    orgId: PropTypes.string.isRequired
  },
  handleClick (e) {
    e.preventDefault();
    this.props.markAsDone();
    go({
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId: this.props.orgId }
    });
  },
  render () {
    const props = {
      headerCopy: 'Invite a developer',
      headerIcon: 'onboarding-add-user',
      isDone: this.props.isDone
    };

    return (
      <SplitStep {...props}>
        <p>Need some help setting up your project? Invite a developer to get started.</p>
        <a className='tea-onboarding__split-step-cta' onClick={this.handleClick}>
          Invite user
        </a>
      </SplitStep>
    );
  }
});

const SplitStep = createReactClass({
  propTypes: {
    headerCopy: PropTypes.string.isRequired,
    headerIcon: PropTypes.string.isRequired,
    isDone: PropTypes.bool.isRequired,
    children: PropTypes.array.isRequired
  },
  render () {
    const {headerCopy, headerIcon, isDone, children} = this.props;

    return (
      <div className='tea-onboarding__split-step'>
        <div className='tea-onboarding__split-step-header'>
          {
            isDone
            ? <Icon name='icon-checkmark-done' className='tea-onboarding__step-header-icon' key='complete-step' />
            : <Icon name={headerIcon} className='tea-onboarding__step-header-icon' key='incomplete-step' />
          }
          <h3>{headerCopy}</h3>
        </div>
        <div className='tea-onboarding__split-step-body'>
          {children}
        </div>
      </div>
    );
  }
});

const Step = createReactClass({
  propTypes: {
    headerCopy: PropTypes.string.isRequired,
    headerIcon: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    children: PropTypes.array.isRequired
  },
  getInitialState () {
    return {
      isExpanded: this.props.isExpanded
    };
  },
  componentWillReceiveProps (nextProps) {
    this.setState({
      isExpanded: nextProps.isExpanded
    });
  },
  render () {
    const {isExpanded} = this.state;
    const {isDone, headerIcon, headerCopy, children} = this.props;

    return (
      <div className='tea-onboarding__step'>
        <div className='tea-onboarding__step-header'>
          {
            isDone
            ? <Icon name='icon-checkmark-done' className='tea-onboarding__step-header-icon' key='complete-step'/>
            : <Icon name={headerIcon} className='tea-onboarding__step-header-icon' key='incomplete-step'/>
          }
          <h3 className='tea-onboarding__step-heading'>{headerCopy}</h3>
          <span className='tea-onboarding__step-toggle'>
            Hide details <i className={isExpanded ? 'arrow-down' : 'arrow-right'} />
          </span>
        </div>
        <div className={`tea-onboarding__step-body ${isExpanded ? 'tea-onboarding__step-body--expanded' : ''}`}>
          {children}
        </div>
      </div>
    );
  }
});

export default TEASteps;
