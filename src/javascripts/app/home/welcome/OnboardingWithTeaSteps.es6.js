import React from 'libs/react';
import createReactClass from 'create-react-class';
import PropTypes from 'libs/prop-types';
import Icon from 'ui/Components/Icon';
import {href, go} from 'states/Navigator';
import spaceContext from 'spaceContext';
import {runTask} from 'utils/Concurrent';
import entityCreator from 'entityCreator';
import {env} from 'Config';
import qs from 'libs/qs';

const VIEW_SAMPLE_CONTENT = 'viewSampleContent';
const PREVIEW_USING_EXAMPLE_APP = 'previewUsingExampleApp';
const CREATE_ENTRY = 'createEntry';
const GET_REPO = 'getRepo';
const INVITE_DEV = 'inviteDev';

export const STEPS_KEYS = {
  VIEW_SAMPLE_CONTENT, PREVIEW_USING_EXAMPLE_APP, CREATE_ENTRY, GET_REPO, INVITE_DEV
};

const TEASteps = createReactClass({
  propTypes: {
    orgId: PropTypes.string.isRequired,
    state: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    toggleExpanding: PropTypes.func.isRequired
  },
  markAsDone (step) {
    const action = this.props.actions[step];

    action && action();
  },
  render () {
    const { state, toggleExpanding } = this.props;

    return (
      <div className='tea-onboarding__steps'>
        <ViewSampleContentStep
          isExpanded={state.expanded === VIEW_SAMPLE_CONTENT}
          onToggle={toggleExpanding}
          {...state[VIEW_SAMPLE_CONTENT]}
          markAsDone={_ => this.markAsDone(VIEW_SAMPLE_CONTENT)} />
        <PreviewUsingExampleAppStep
          isExpanded={state.expanded === PREVIEW_USING_EXAMPLE_APP}
          {...state[PREVIEW_USING_EXAMPLE_APP]}
          onToggle={toggleExpanding}
          markAsDone={_ => this.markAsDone(PREVIEW_USING_EXAMPLE_APP)} />
        <CreateEntryStep
          isExpanded={state.expanded === CREATE_ENTRY}
          {...state[CREATE_ENTRY]}
          onToggle={toggleExpanding}
          markAsDone={_ => this.markAsDone(CREATE_ENTRY)} />
        <GetRepoOrInviteDevStep
          getRepo={{...state[GET_REPO], markAsDone: _ => this.markAsDone(GET_REPO)}}
          inviteDev={{...state[INVITE_DEV], markAsDone: _ => this.markAsDone(INVITE_DEV), orgId: this.props.orgId}} />
      </div>
    );
  }
});

const VIEW_CONTENT_TYPE_ID = 'course';

const ViewSampleContentStep = createReactClass({
  propTypes: {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  },
  primaryCtaOnClick () {
    this.props.markAsDone();
  },
  render () {
    const {isDone, isExpanded, onToggle} = this.props;
    const propsForStep = {
      headerCopy: 'View the sample content',
      headerIcon: 'page-ct',
      isExpanded,
      isDone,
      stepKey: VIEW_SAMPLE_CONTENT,
      onToggle
    };

    const baseLink = href({ path: ['spaces', 'detail', 'entries', 'list'], params: { spaceId: spaceContext.space.getId() } });
    const linkWithQuery = `${baseLink}?contentTypeId=${VIEW_CONTENT_TYPE_ID}`;

    return (
      <Step {...propsForStep}>
        <div>
          <div className='tea-onboarding__step-description'>
            <p>This example space shows best practices on how to structure your content and integrate your website and app with Contentful.</p>
            <p>Have a look at the two courses composing this example.</p>
          </div>
          <a target={'_blank'} rel={'noopener'} href={linkWithQuery} className='btn-action tea-onboarding__step-cta' onClick={e => this.primaryCtaOnClick(e)}>
            View content
          </a>
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
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      cdaToken: null,
      cpaToken: null
    };
  },
  primaryCtaOnClick () {
    this.props.markAsDone();
  },
  componentDidMount () {
    const self = this;
    runTask(function* () {
      const keys = yield spaceContext.apiKeyRepo.getAll();
      const key = keys[0];
      self.setState({
        cdaToken: key.accessToken
      });
      const keyWithPreview = yield spaceContext.apiKeyRepo.get(keys[0].sys.id);
      self.setState({
        cpaToken: keyWithPreview.preview_api_key.accessToken
      });
    });
  },
  getPreviewUrl () {
    const { cdaToken, cpaToken } = this.state;
    // we can retrieve this URL from content preview or construct it by ourselves
    // there is no direct links to /courses, so it means we'll need to modify some
    // content preview (in the middle). So it is easier just to construct by ourselves
    // TODO: add params and env

    const queryParams = {
      // next params allow to use user's space as a source for the app itself
      // so his changes will be refleced on the app's content
      space_id: spaceContext.space.getId(),
      delivery_token: cdaToken,
      preview_token: cpaToken,
      // user will be able to go back to the webapp from TEA using links
      // without this flag, there will be no links in UI of TEA
      editorial_features: 'enabled',
      // we want to have faster feedback for the user after his changes
      // CPA reacts to changes in ~5 seconds, CDA in more than 10
      api: 'cpa'
    };
    const queryString = qs.stringify(queryParams);

    const domain = env === 'production' ? 'contentful' : 'flinkly';
    return `https://the-example-app-nodejs.${domain}.com/courses${queryString ? '?' : ''}${queryString}`;
  },
  render () {
    const {isDone, isExpanded, onToggle} = this.props;
    const propsForStep = {
      headerCopy: 'Preview using the example app',
      headerIcon: 'page-apis',
      isExpanded,
      isDone,
      onToggle,
      stepKey: PREVIEW_USING_EXAMPLE_APP
    };

    const url = this.getPreviewUrl();

    return (
      <Step {...propsForStep}>
        <div>
          <div className='tea-onboarding__step-description'>
            <p>
              You can preview the two sample courses using the example app that is connected to this
              space. The app is available for multiple platforms such as JavaScript, Java, .NET and more.
            </p>
          </div>
          <a
            href={url}
            target={'_blank'}
            rel={'noopener'}
            className='btn-action tea-onboarding__step-cta'
            onClick={e => this.primaryCtaOnClick(e)}
          >
            Preview content
          </a>
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
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  },
  getInitialState () {
    return {
      isLoading: false
    };
  },
  findLesson (lessons) {
    const lesson = lessons.find(lesson => {
      const matchSlug = lesson.fields.slug['en-US'] === 'serve-localized-content';
      const matchTitle = lesson.fields.title['en-US'] === 'Serve localized content';
      return matchSlug || matchTitle;
    });

    if (lesson) {
      return lesson;
    } else {
      return lessons[0];
    }
  },
  createNewLessonCopy () {
    const contentType = 'lessonCopy';
    return entityCreator.newEntry(contentType);
  },
  processNewEntry () {
    const self = this;
    self.setState({
      isLoading: true
    });
    return runTask(function* () {
      // get all lesson entries
      const lessons = yield spaceContext.cma.getEntries({
        content_type: 'lesson'
      });
      // find a lesson where we want to add new module
      const lesson = self.findLesson(lessons.items);

      // create new lesson copy entry
      const newEntry = yield self.createNewLessonCopy();
      const newEntryId = newEntry.getId();
      const newLinkedModule = {
        sys: {
          id: newEntryId,
          linkType: 'Entry',
          type: 'Link'
        }
      };

      lesson.fields.modules['en-US'].push(newLinkedModule);

      yield spaceContext.cma.updateEntry(lesson);

      go({
        path: ['spaces', 'detail', 'entries', 'detail'],
        params: {
          entryId: newEntryId
        }
      });
    }).then(() => {
      self.setState({
        isLoading: false
      });
    });
  },
  primaryCtaOnClick () {
    this.processNewEntry().then(this.props.markAsDone);
  },
  render () {
    const {isLoading} = this.state;
    const {isDone, isExpanded, onToggle} = this.props;
    const propsForStep = {
      headerCopy: 'Create your first entry',
      headerIcon: 'page-content',
      isExpanded,
      isDone,
      onToggle,
      stepKey: CREATE_ENTRY
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
          <button className={`btn-action tea-onboarding__step-cta ${isLoading ? 'is-loading' : ''}`} onClick={e => this.primaryCtaOnClick(e)}>
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
           href='https://github.com/contentful?utf8=%E2%9C%93&q=%22the-example-app%22&type=&language='
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
  },
  render () {
    const props = {
      headerCopy: 'Invite a developer',
      headerIcon: 'onboarding-add-user',
      isDone: this.props.isDone
    };

    const inviteLink = href({
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId: this.props.orgId }
    });

    return (
      <SplitStep {...props}>
        <p>Need some help setting up your project? Invite a developer to get started.</p>
        <a href={inviteLink} className='tea-onboarding__split-step-cta' onClick={this.handleClick}>
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
    children: PropTypes.array.isRequired,
    onToggle: PropTypes.func.isRequired,
    stepKey: PropTypes.string.isRequired
  },
  toggle () {
    const { onToggle, stepKey } = this.props;
    onToggle && onToggle(stepKey);
  },
  render () {
    const {isDone, headerIcon, headerCopy, children, isExpanded} = this.props;

    return (
      <div className='tea-onboarding__step'>
        <div className='tea-onboarding__step-header' onClick={this.toggle}>
          {
            isDone
            ? <Icon name='icon-checkmark-done' className='tea-onboarding__step-header-icon' key='complete-step'/>
            : <Icon name={headerIcon} className='tea-onboarding__step-header-icon' key='incomplete-step'/>
          }
          <h3 className='tea-onboarding__step-heading'>{headerCopy}</h3>
          <div className='tea-onboarding__step-toggle'>
            <span>{isExpanded ? 'Hide' : 'See'} details</span>
            <span className={`arrow ${isExpanded ? 'toggle' : ''}`}></span>
          </div>
        </div>
        <div className={`tea-onboarding__step-body ${isExpanded ? 'tea-onboarding__step-body--expanded' : ''}`}>
          {children}
        </div>
      </div>
    );
  }
});

export default TEASteps;
