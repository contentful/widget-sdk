import React from 'react';
import WidgetContainer from 'app/home/widgets/WidgetContainer.es6';
import GreetingWidget from 'app/home/widgets/GreetingWidget.es6';

export default class SpaceHome extends React.Component {
  render() {
    return (
      <WidgetContainer>
        <GreetingWidget {...this.props} />
      </WidgetContainer>
    );
  }
}
