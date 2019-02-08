import React from 'react';
import PropTypes from 'prop-types';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';
import ConceptVideoWidget from './widgets/ConceptVideoWidget.es6';
import WalkthroughWidget from './widgets/walkthrough/WalkthroughWidget.es6';

export default class SpaceHome extends React.Component {
  state = {
    walkthroughUserState: { started: undefined }
  };

  static propTypes = {
    spaceName: PropTypes.string,
    orgName: PropTypes.string
  };

  setWalkthroughState = ({ started }) => this.setState({ walkthroughUserState: { started } });

  render() {
    const { spaceName, orgName } = this.props;
    const { walkthroughUserState } = this.state;
    return (
      <WidgetContainer>
        <GreetingWidget
          spaceName={spaceName}
          orgName={orgName}
          walkthroughStarted={walkthroughUserState.started}
        />
        <WalkthroughWidget
          spaceName={spaceName}
          setWalkthroughState={this.setWalkthroughState}
          order={walkthroughUserState.started && '3'}
        />
        <ConceptVideoWidget />
      </WidgetContainer>
    );
  }
}
