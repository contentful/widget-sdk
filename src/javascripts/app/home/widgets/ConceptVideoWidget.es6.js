import React from 'react';
import ReactPlayer from 'react-player';
import { Card, Subheading } from '@contentful/forma-36-react-components';

export default class SpaceHome extends React.Component {
  render() {
    return (
      <Card extraClassNames="concept-video-widget" padding="none">
        <Subheading className="concept-video-widget__header">
          Learn how content is structured in Contentful
        </Subheading>
        <div className="concept-video-widget__content">
          <div className="concept-video-widget__copy">
            <p>
              With Contentful, all text, images, media and other content can be used over and over
              again in different parts of your website or device. This content can also be used
              across many other channels, such as email. At Contentful, we call this Reusable
              Content.
            </p>
            <p>
              This makes it possible to only create content once, rather than reformatting or
              developing it for each use case. It also creates consistency across all published
              content.
            </p>
          </div>
          <ReactPlayer
            className="concept-video-widget__player"
            url="https://contentful.wistia.com/medias/a0ug09pj1j"
            width="397px"
            height="223px"
            config={{
              wistia: {
                options: {
                  popover: true
                }
              }
            }}
          />
        </div>
      </Card>
    );
  }
}
