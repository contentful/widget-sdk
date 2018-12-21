import React from 'react';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';

export default class SpaceHome extends React.Component {
  render() {
    return (
      <WidgetContainer>
        <GreetingWidget {...this.props} />
      </WidgetContainer>
    );
  }
}
