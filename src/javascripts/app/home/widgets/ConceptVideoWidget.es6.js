import React from 'react';
import ReactPlayer from 'react-player';
import { Card, Subheading } from '@contentful/forma-36-react-components';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import $ from 'jquery';

const logger = getModule('logger');
const $state = getModule('$state');

export default class SpaceHome extends React.Component {
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
      onReady: function(video) {
        $('.concept-video-widget__play-button').bind('click', () => {
          video.popover.show();
          video.play();
        });
        video.bind('end', function() {
          video.popover.hide();
        });
      }
    });
  };
  componentWillUnmount = () => {
    $('.concept-video-widget__play-button').unbind();
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
            <button className="concept-video-widget__play-button" aria-label="Play">
              <div className="concept-video-widget__play-button-icon" />
            </button>
          </div>
        </div>
      </Card>
    );
  }
}
