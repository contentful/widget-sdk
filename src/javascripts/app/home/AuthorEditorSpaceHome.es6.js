import React from 'react';
import PropTypes from 'prop-types';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';
import ConceptVideoWidget from './widgets/ConceptVideoWidget.es6';

export default class SpaceHome extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string,
    orgName: PropTypes.string
  };
  render() {
    const { spaceName, orgName } = this.props;
    return (
      <WidgetContainer>
        <GreetingWidget spaceName={spaceName} orgName={orgName} />
        <ConceptVideoWidget />
      </WidgetContainer>
    );
  }
}
