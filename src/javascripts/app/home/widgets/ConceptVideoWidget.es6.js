import React from 'react';
import ReactPlayer from 'react-player';
import { Card, Subheading } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import $ from 'jquery';
import { TypeformModal } from 'app/common/Typeform/TypeformModal.es6';

const logger = getModule('logger');
const $state = getModule('$state');

export default class SpaceHome extends React.Component {
  state = {
    showFeedbackModal: false
  };

  onStart = () =>
    track('element:click', {
      elementId: 'concept_video_pay',
      groupId: 'author_editor_continuous_onboarding',
      fromState: $state.current.name
    });

  onError = error =>
    logger.logError('Wistia video player', {
      message: 'An error occurred while attempting to play Concept Video for authors and editors',
      error
    });

  componentDidMount = () => {
    window._wq = window._wq || [];
    window._wq.push({
      id: '_all',
      onReady: video => {
        $('.concept-video-widget__play-button').bind('click', () => {
          video.popover.show();
          video.play();
        });
        video.bind('end', () => {
          video.popover.hide();
        });
        // figure out how to bind this only if the user hasn't already submitted feedback
        video.bind('crosstime', 77, () => {
          video.pause();
          video.popover.hide();
          this.openTypeform();
          // the feedback form will only be shown the first time the video is watched on a reload.
          // Subsequent plays will not trigger the feedback form.
          // Upon reload, if the user has not submitted feedback (known via state-persistence-api),
          // the feedback form will get triggered at 76s.
          return video.unbind;
        });
      }
    });
  };

  componentWillUnmount = () => {
    $('.concept-video-widget__play-button').unbind();
  };

  openTypeform = () => {
    this.setState({
      showFeedbackModal: true
    });
  };

  handleTypeformSubmit = () => {
    // write to state persistence api
    this.typeformCloseTimeout = setTimeout(() => {
      this.closeTypeform();
    }, 1200);
  };

  closeTypeform = () => {
    this.setState({
      showFeedbackModal: false
    });
  };

  render() {
    return (
      <Card extraClassNames="concept-video-widget" padding="none">
        <Subheading className="concept-video-widget__header">
          Learn how content is structured in Contentful
        </Subheading>
        <div className="concept-video-widget__content">
          <div className="concept-video-widget__copy">
            <p>
              In Contentful, your content is structured and developed in the most modern way. All
              content is organized into Content Types, enabling it to be reused rather than
              recreated for each use case. This creates consistency across all published content and
              makes it faster to edit, translate and extend across many platforms.
            </p>
            <p>
              Using Contentful means you’ll spend less time editing content in multiple places, and
              focus on creating engaging experiences.
            </p>
          </div>
          <div className="concept-video-widget__player-wrapper">
            <ReactPlayer
              className="concept-video-widget__player"
              url="https://contentful.wistia.com/medias/eqe3z9sk1p"
              width="397px"
              height="223px"
              onStart={this.onStart}
              onError={this.onError}
              config={{
                wistia: {
                  options: {
                    popover: true,
                    playButton: false
                  }
                }
              }}
            />
            <button
              className="concept-video-widget__play-button"
              aria-label="Play"
              data-test-id="play-concepts-video-btn">
              <div className="concept-video-widget__play-button-icon" />
            </button>
          </div>
        </div>
        <TypeformModal
          title="Share your feedback about the concepts video"
          isShown={this.state.showFeedbackModal}
          onClose={this.closeTypeform}
          testId="concepts-video-feedback-modal"
          typeformUrl="https://contentful.typeform.com/to/uLHfR1"
          onTypeformSubmit={this.handleTypeformSubmit}
        />
      </Card>
    );
  }
}
