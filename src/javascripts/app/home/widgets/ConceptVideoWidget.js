import React from 'react';
import ReactPlayer from 'react-player';
import { getCurrentStateName } from 'states/Navigator';
import { Card, Subheading } from '@contentful/forma-36-react-components';
import { track } from 'analytics/Analytics';
import * as logger from 'services/logger';

export default class ConceptVideoWidget extends React.Component {
  state = {
    playVideo: () => {}
  };

  onStart = () => {
    track('element:click', {
      elementId: 'concept_video_play',
      groupId: 'author_editor_continuous_onboarding',
      fromState: getCurrentStateName()
    });
  };

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
        this.setState({
          playVideo: () => {
            video.popover.show();
            video.play();
          }
        });

        video.bind('end', () => {
          video.popover.hide();
        });
      }
    });
  };

  render() {
    return (
      <Card
        data-ui-tour-step="concept-video-widget"
        className="concept-video-widget"
        padding="none">
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
              data-test-id="play-concepts-video-btn"
              onClick={this.state.playVideo}>
              <div className="concept-video-widget__play-button-icon" />
            </button>
          </div>
        </div>
      </Card>
    );
  }
}
