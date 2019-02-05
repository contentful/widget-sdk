import React from 'react';
import ReactPlayer from 'react-player';
import { Card, Subheading } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import $ from 'jquery';
import { TypeformModal } from 'app/common/Typeform/TypeformModal.es6';
import { fetchUserState, updateUserState } from 'utils/StatePersistenceApi.es6';

const logger = getModule('logger');
const $state = getModule('$state');

const feedbackKey = 'feedback';

export default class ConceptVideoWidget extends React.Component {
  state = {
    feedbackModalIsOpen: false,
    userHasProvidedFeedback: false
  };

  onStart = () =>
    track('element:click', {
      elementId: 'concept_video_play',
      groupId: 'author_editor_continuous_onboarding',
      fromState: $state.current.name
    });

  onError = error =>
    logger.logError('Wistia video player', {
      message: 'An error occurred while attempting to play Concept Video for authors and editors',
      error
    });

  fetchUserFeedbackState = async () => {
    try {
      const { conceptsVideo: userHasProvidedFeedback } = await fetchUserState(feedbackKey);

      this.setState({
        userHasProvidedFeedback
      });
    } catch (error) {
      logger.logError('ConceptVideoWidget: state-persistence-api fetch error', {
        message: `An error occured while fetching data for key "${feedbackKey}" from state-persistence-api`,
        error
      });
    }
  };

  markUserAsHasCompletedFeedback = async () => {
    // if the user has already provided feedback, this implies that feedback.conceptsVideo
    // is `true` in state-persistence-api (SPA). This is a terminal condition as we never want
    // to go from feedback.conceptsVideo being `true` to `false`. No bit of code here does that.
    // Therefore, it is safe to not make any requests to SPA if userHasProvidedFeedback is `true`.
    try {
      if (this.state.userHasProvidedFeedback) {
        return;
      } else {
        const {
          conceptsVideo: userHasProvidedFeedback,
          sys: { version }
        } = await fetchUserState(feedbackKey);

        // same reason as above. If the SPA returns true for feedback.conceptsWidget, then it's
        // already in its terminal state and we don't have to update the value for "feedback" key
        // in SPA.
        if (userHasProvidedFeedback) {
          this.setState({
            userHasProvidedFeedback
          });
        } else {
          const payload = {
            conceptsVideo: true,
            version
          };

          const { conceptsVideo: userHasProvidedFeedback } = await updateUserState(
            feedbackKey,
            payload
          );

          this.setState({
            userHasProvidedFeedback
          });
        }
      }
    } catch (error) {
      // if any step errors, we log and don't retry as for this feature i.e., "feedback",
      // it's ok if we ask a user that has already submitted feedback to submit it again.
      // This can only occur when the first write fails. If any writes go through, this
      // will cause no issues.
      logger.logError('ConceptVideoWidget: state-persistence-api update error', {
        message: `An error occured while updating data for key "${feedbackKey}" in state-persistence-api`,
        error
      });
    }
  };

  componentDidMount = () => {
    this.fetchUserFeedbackState();

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

        video.bind('crosstime', 60, () => {
          if (!this.state.userHasProvidedFeedback) {
            this.fetchUserFeedbackState();
          }
          return video.unbind;
        });
        // figure out how to bind this only if the user hasn't already submitted feedback
        video.bind('crosstime', 76, () => {
          if (!this.state.userHasProvidedFeedback) {
            video.pause();
            video.popover.hide();
            this.openTypeform();
          }
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
      feedbackModalIsOpen: true
    });
  };

  handleTypeformSubmit = () => {
    // mark the user as having provided feedback for concept video
    // in state-persistence-api
    this.markUserAsHasCompletedFeedback();
    this.typeformCloseTimeout = setTimeout(() => {
      this.closeTypeform();
    }, 1200);
  };

  closeTypeform = () => {
    this.setState({
      feedbackModalIsOpen: false
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
          isShown={this.state.feedbackModalIsOpen}
          onClose={this.closeTypeform}
          testId="concepts-video-feedback-modal"
          typeformUrl="https://contentful.typeform.com/to/uLHfR1"
          onTypeformSubmit={this.handleTypeformSubmit}
        />
      </Card>
    );
  }
}
