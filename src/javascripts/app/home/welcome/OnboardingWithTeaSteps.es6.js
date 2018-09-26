import React from 'react';
import PropTypes from 'prop-types';
import Icon from 'ui/Components/Icon.es6';
import TeaScreenshot from './TeaScreenshot.es6';
import { href, go } from 'states/Navigator.es6';
import spaceContext from 'spaceContext';
import { runTask } from 'utils/Concurrent.es6';
import entityCreator from 'entityCreator';
import { env } from 'Config.es6';
import qs from 'qs';

const VIEW_SAMPLE_CONTENT = 'viewSampleContent';
const PREVIEW_USING_EXAMPLE_APP = 'previewUsingExampleApp';
const CREATE_ENTRY = 'createEntry';
const GET_REPO = 'getRepo';
const INVITE_DEV = 'inviteDev';

export const STEPS_KEYS = {
  VIEW_SAMPLE_CONTENT,
  PREVIEW_USING_EXAMPLE_APP,
  CREATE_ENTRY,
  GET_REPO,
  INVITE_DEV
};

export class TEASteps extends React.Component {
  static propTypes = {
    state: PropTypes.object.isRequired,
    actions: PropTypes.object.isRequired,
    toggleExpanding: PropTypes.func.isRequired
  };

  markAsDone = step => {
    const action = this.props.actions[step];

    action && action();
  };

  render() {
    const { state, toggleExpanding } = this.props;

    return (
      <div className="tea-onboarding__steps">
        <ViewSampleContentStep
          isExpanded={state.expanded === VIEW_SAMPLE_CONTENT}
          onToggle={toggleExpanding}
          {...state[VIEW_SAMPLE_CONTENT]}
          markAsDone={_ => this.markAsDone(VIEW_SAMPLE_CONTENT)}
        />
        <PreviewUsingExampleAppStep
          isExpanded={state.expanded === PREVIEW_USING_EXAMPLE_APP}
          {...state[PREVIEW_USING_EXAMPLE_APP]}
          onToggle={toggleExpanding}
          markAsDone={_ => this.markAsDone(PREVIEW_USING_EXAMPLE_APP)}
        />
        <CreateEntryStep
          isExpanded={state.expanded === CREATE_ENTRY}
          {...state[CREATE_ENTRY]}
          onToggle={toggleExpanding}
          markAsDone={_ => this.markAsDone(CREATE_ENTRY)}
        />
        <InviteADevStep {...state[INVITE_DEV]} markAsDone={_ => this.markAsDone(INVITE_DEV)} />
      </div>
    );
  }
}

const VIEW_CONTENT_TYPE_ID = 'course';

class ViewSampleContentStep extends React.Component {
  static propTypes = {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  primaryCtaOnClick = (e, urlParams) => {
    e.preventDefault();
    this.props.markAsDone();
    // we do that for 2 reasons:
    // 1. angular ui-router prevents all callbacks on links with no `target="_blank"`
    // 2. we can't pass initial search parameters to entries list route :(
    go(urlParams);
  };

  render() {
    const { isDone, isExpanded, onToggle } = this.props;
    const propsForStep = {
      headerCopy: 'View the sample content',
      headerIcon: 'page-ct',
      isExpanded,
      isDone,
      stepKey: VIEW_SAMPLE_CONTENT,
      onToggle
    };

    const urlParams = {
      path: ['spaces', 'detail', 'entries', 'list'],
      params: { spaceId: spaceContext.space.getId() }
    };
    const baseLink = href(urlParams);
    const linkWithQuery = `${baseLink}?contentTypeId=${VIEW_CONTENT_TYPE_ID}`;

    return (
      <Step {...propsForStep}>
        <div>
          <div className="tea-onboarding__step-description">
            <p>
              This example space shows best practices on how to structure your content and integrate
              your website or app with Contentful.
            </p>
            <p>Let’s view the content available, starting with two sample courses.</p>
          </div>
          <a
            target={'_blank'}
            rel={'noopener'}
            href={linkWithQuery}
            className="btn-action tea-onboarding__step-cta"
            onClick={e => this.primaryCtaOnClick(e, urlParams)}>
            View content
          </a>
        </div>
        <div>
          <p className="tea-onboarding__step-graphic-description">
            Here’s how the content is nested:
          </p>
          <Icon className="tea-onboarding__step-graphic" name="content-structure-graph" />
        </div>
      </Step>
    );
  }
}

class PreviewUsingExampleAppStep extends React.Component {
  static propTypes = {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  state = {
    cdaToken: null,
    cpaToken: null
  };

  primaryCtaOnClick = () => {
    this.props.markAsDone();
  };

  componentDidMount() {
    const self = this;
    runTask(function*() {
      const keys = yield spaceContext.apiKeyRepo.getAll();
      const key = keys[0];
      // there might be no keys - it was not created yet, or user explicitly removed them
      if (key) {
        self.setState({
          cdaToken: key.accessToken
        });
        const keyWithPreview = yield spaceContext.apiKeyRepo.get(keys[0].sys.id);
        self.setState({
          cpaToken: keyWithPreview.preview_api_key.accessToken
        });
      }
    });
  }

  getPreviewUrl = () => {
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
    return `https://the-example-app-nodejs.${domain}.com/courses${
      queryString ? '?' : ''
    }${queryString}`;
  };

  render() {
    const { isDone, isExpanded, onToggle } = this.props;
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
          <div className="tea-onboarding__step-description">
            <p>
              You can preview the two sample courses using the example app that is connected to this
              space. The app is available for multiple platforms such as JavaScript, Ruby, .NET and
              more.
            </p>
          </div>
          <a
            href={url}
            target={'_blank'}
            rel={'noopener'}
            className="btn-action tea-onboarding__step-cta"
            onClick={e => this.primaryCtaOnClick(e)}>
            Preview content
          </a>
        </div>
        <div className="tea-onboarding__step-graphic">
          <TeaScreenshot />
        </div>
      </Step>
    );
  }
}

class CreateEntryStep extends React.Component {
  static propTypes = {
    markAsDone: PropTypes.func.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired
  };

  state = {
    isLoading: false
  };

  findLesson = lessons => {
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
  };

  createNewLessonCopy = () => {
    const contentType = 'lessonCopy';
    return entityCreator.newEntry(contentType);
  };

  processNewEntry = () => {
    const self = this;
    self.setState({
      isLoading: true
    });
    return runTask(function*() {
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
  };

  primaryCtaOnClick = () => {
    this.processNewEntry().then(this.props.markAsDone);
  };

  render() {
    const { isLoading } = this.state;
    const { isDone, isExpanded, onToggle } = this.props;
    const propsForStep = {
      headerCopy: 'Create your first entry & preview it',
      headerIcon: 'page-content',
      isExpanded,
      isDone,
      onToggle,
      stepKey: CREATE_ENTRY
    };

    return (
      <Step {...propsForStep}>
        <div>
          <div className="tea-onboarding__step-description">
            <p>
              Try it yourself. Create a new entry in the “Serve localized content” lesson. You’ll
              notice that a second language is enabled - so you can practice your German along the
              way!
            </p>
            <p>To see changes immediately use the “Open preview” button.</p>
          </div>
          <button
            className={`btn-action tea-onboarding__step-cta ${isLoading ? 'is-loading' : ''}`}
            onClick={e => this.primaryCtaOnClick(e)}>
            Create entry
          </button>
        </div>
        <div>
          <p className="tea-onboarding__step-graphic-description">Your new entry in context.</p>
          <Icon className="tea-onboarding__step-graphic" name="content-graph-highlight" />
        </div>
      </Step>
    );
  }
}

class InviteADevStep extends React.Component {
  static propTypes = {
    isDone: PropTypes.bool.isRequired,
    markAsDone: PropTypes.func.isRequired
  };

  handleClick = (e, urlParams) => {
    e.preventDefault();
    // we redirect user directly in order to be able to handle
    // this callback - otherwise ui-router will prevent its execution
    this.props.markAsDone();
    go(urlParams);
  };

  render() {
    const props = {
      headerCopy: 'Invite a developer',
      headerIcon: 'onboarding-add-user',
      isDone: this.props.isDone
    };

    let orgId;

    try {
      orgId = spaceContext.space.getOrganizationId();
    } catch (e) {
      // we just won't render the link
    }

    const urlParams = {
      path: ['account', 'organizations', 'users', 'new'],
      params: { orgId }
    };
    const inviteLink = href(urlParams);

    return (
      <AltStep {...props}>
        {orgId && (
          <a
            href={inviteLink}
            target={'_blank'}
            rel={'noopener noreferrer'}
            className="tea-onboarding__alt-step-cta"
            onClick={e => this.handleClick(e, urlParams)}>
            Invite user
            <span className="arrow" />
          </a>
        )}
      </AltStep>
    );
  }
}

export class AltStep extends React.Component {
  static propTypes = {
    headerCopy: PropTypes.string.isRequired,
    headerIcon: PropTypes.string.isRequired,
    isDone: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired
  };

  render() {
    const { headerCopy, headerIcon, isDone, children } = this.props;

    return (
      <div className="tea-onboarding__alt-step">
        <div className="tea-onboarding__alt-step-header">
          {isDone ? (
            <Icon
              name="icon-checkmark-done"
              className="tea-onboarding__step-header-icon"
              key="complete-step"
            />
          ) : (
            <Icon
              name={headerIcon}
              className="tea-onboarding__step-header-icon"
              key="incomplete-step"
            />
          )}
          <h4>{headerCopy}</h4>
        </div>
        <div className="tea-onboarding__alt-step-body">{children}</div>
      </div>
    );
  }
}

export class Step extends React.Component {
  static propTypes = {
    headerCopy: PropTypes.string.isRequired,
    headerIcon: PropTypes.string.isRequired,
    isExpanded: PropTypes.bool.isRequired,
    isDone: PropTypes.bool.isRequired,
    children: PropTypes.node.isRequired,
    onToggle: PropTypes.func.isRequired,
    stepKey: PropTypes.string.isRequired
  };

  toggle = () => {
    const { onToggle, stepKey } = this.props;
    onToggle && onToggle(stepKey);
  };

  render() {
    const { isDone, headerIcon, headerCopy, children, isExpanded } = this.props;

    return (
      <div className="tea-onboarding__step">
        <div className="tea-onboarding__step-header" onClick={this.toggle}>
          {isDone ? (
            <Icon
              name="icon-checkmark-done"
              className="tea-onboarding__step-header-icon"
              key="complete-step"
            />
          ) : (
            <Icon
              name={headerIcon}
              className="tea-onboarding__step-header-icon"
              key="incomplete-step"
            />
          )}
          <h4 className="tea-onboarding__step-heading">{headerCopy}</h4>
          <div className="tea-onboarding__step-toggle">
            <span>{isExpanded ? 'Hide' : 'See'} details</span>
            <span className={`arrow ${isExpanded ? 'toggle' : ''}`} />
          </div>
        </div>
        <div
          className={`tea-onboarding__step-body ${
            isExpanded ? 'tea-onboarding__step-body--expanded' : ''
          }`}>
          {children}
        </div>
      </div>
    );
  }
}
