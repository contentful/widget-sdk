import React from 'react';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';

export default class SpaceHome extends React.Component {
  render() {
    return (
      <WidgetContainer>
        <GreetingWidget {...this.props} />
        <iframe
          allowTransparency="true"
          title="Wistia video player"
          allowFullscreen
          frameBorder="0"
          scrolling="no"
          className="wistia_embed"
          name="wistia_embed"
          src="https://fast.wistia.net/embed/iframe/uvvjsg6wdo"
          width="400"
          height="225"
        />
        <iframe
          width="560"
          height="315"
          src="https://www.youtube.com/embed/sVCgDiU1WHc"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </WidgetContainer>
    );
  }
}
