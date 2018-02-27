import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';
import {findKey} from 'lodash';

const VIEW_SAMPLE_CONTENT = 'viewSampleContent';
const PREVIEW_USING_EXAMPLE_APP = 'previewUsingExampleApp';
const CREATE_ENTRY = 'createEntry';
const GET_REPO_OR_INVITE_DEV = 'getRepoOrInviteDev';

const Steps = createReactClass({
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
        {/* <GetRepoOrInviteDevStep
          {...this.state[GET_REPO_OR_INVITE_DEV]}
          markAsDone={_ => this.markAsDone(GET_REPO_OR_INVITE_DEV)} /> */}
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
          <img src='/app/images/editor-screenshot.png' />
        </div>
      </Step>
    );
  }
});

const GetRepoOrInviteDevStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isDone: PropTypes.bool.isRequired
  },
  render () {
    return (
      <div>
        <GetRepoForExampleAppStep />
        <InviteADevStep />
      </div>
    );
  }
});

const GetRepoForExampleAppStep = createReactClass({
  render () {
    return <Step />;
  }
});

const InviteADevStep = createReactClass({
  render () {
    return <Step />;
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
          <Icon name='page-media' className='tea-onboarding__step-header-icon' />
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
