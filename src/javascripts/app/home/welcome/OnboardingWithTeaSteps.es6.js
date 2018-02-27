import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';
import {findKey, omit} from 'lodash';
import {go} from 'states/Navigator';

const VIEW_SAMPLE_CONTENT = 'viewSampleContent';
const PREVIEW_USING_EXAMPLE_APP = 'previewUsingExampleApp';
const CREATE_ENTRY = 'createEntry';
const GET_REPO_OR_INVITE_DEV = 'getRepoOrInviteDev';

const Steps = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired
  },
  getInitialState () {
    return {
      [VIEW_SAMPLE_CONTENT]: { isDone: false },
      [PREVIEW_USING_EXAMPLE_APP]: { isDone: false },
      [CREATE_ENTRY]: { isDone: false },
      [GET_REPO_OR_INVITE_DEV]: { isDone: false }
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
      <div>
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
          orgId={this.props.orgId}
          {...this.state[GET_REPO_OR_INVITE_DEV]}
          markAsDone={_ => this.markAsDone(GET_REPO_OR_INVITE_DEV)} />
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
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div>
            <p>This example space shows best practices on how to structure your content and integrate your website and app with Contentful.</p>
            <p>Have a look at the two courses composing this example.</p>
          </div>
          <button className='btn-action' onClick={e => this.primaryCtaOnClick(e)}>
            View content
          </button>
        </div>
        <div>
          <p>Here’s how this content is nested:</p>
          <Icon name='content-structure-graph' />
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
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div>
            <p>You can preview the two sample courses using the example app that is connected to this space. The app is available for multiple platforms such as JavaScript, Java, .NET and more.</p>
          </div>
          <button className='btn-action' onClick={e => this.primaryCtaOnClick(e)}>
            Preview content
          </button>
        </div>
        <div>
          <Icon name='tea-screenshot' />
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
      isExpanded,
      isDone
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div>
            <p>To test it yourself, add a new copy module to a lesson. You’ll notice that a second language is enabled - so you can practice your German along the way!</p>
            <p>You can see your changes immediately using the “Open preview” button.</p>
          </div>
          <button className='btn-action' onClick={e => this.primaryCtaOnClick(e)}>
            Create entry
          </button>
        </div>
        <div>
          <Icon name='content-graph-highlight' />
        </div>
      </Step>
    );
  }
});

const GetRepoOrInviteDevStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isDone: PropTypes.bool.isRequired,
    orgId: PropTypes.string.isRequired
  },
  render () {
    const propsWithoutOrgId = omit(this.props, 'orgId');

    return (
      <div>
        <GetRepoForExampleAppStep {...propsWithoutOrgId} />
        <InviteADevStep {...this.props} />
      </div>
    );
  }
});

const GetRepoForExampleAppStep = createReactClass({
  // TODO: Handle click for view on github so that we can track things before opening
  // a new tab
  render () {
    const props = {
      headerCopy: 'Get repository for the example app',
      ...this.props
    };
    return (
      <SharedStep {...props}>
        <p>Want to see the code? Find your preferred platform and clone the repository.</p>
        <a href='https://github.com/contentful?utf8=%E2%9C%93&q=the-example-app&type=&language='
           target='_blank'
           rel='noopener noreferrer'>
          View on GitHub
        </a>
      </SharedStep>
    );
  }
});

const InviteADevStep = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    markAsDone: PropTypes.func.isRequired
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
      ...omit(this.props, 'orgId')
    };
    return (
      <SharedStep {...props}>
        <p>Need some help setting up your project? Invite a developer to get started.</p>
        <a onClick={e => this.handleClick(e)}>
          Invite user
        </a>
      </SharedStep>
    );
  }
});

const SharedStep = createReactClass({
  propTypes: {
    headerCopy: PropTypes.string.isRequired,
    isDone: PropTypes.bool.isRequired,
    children: PropTypes.array.isRequired
  },
  render () {
    return (
      <div className='tea-onboarding__step'>
        <div className='tea-onboarding__step-header'>
          <Icon name='page-media' className='tea-onboarding__step-header-icon' />
          <h3>{this.props.headerCopy}</h3>
        </div>
        <div className='tea-onboarding__step-body'>
          {this.props.children}
        </div>
      </div>
    );
  }
});

const Step = createReactClass({
  propTypes: {
    headerCopy: PropTypes.string.isRequired,
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
    return (
      <div className='tea-onboarding__step'>
        <div className='tea-onboarding__step-header'>
          {
            this.props.isDone
            ? <Icon name='icon-checkmark-done' className='tea-onboarding__step-header-icon' key='complete-step'/>
            : <Icon name='page-media' className='tea-onboarding__step-header-icon' key='incomplete-step'/>
          }
          <h3>{this.props.headerCopy}</h3>
          <span>Hide details <i className={this.state.isExpanded ? 'arrow-down' : 'arrow-right'} /></span>
        </div>
        <div className={`tea-onboarding__step-body ${this.state.isExpanded ? 'tea-onboarding__step-body--expanded' : ''}`}>
          {this.props.children}
        </div>
      </div>
    );
  }
});

export default Steps;
