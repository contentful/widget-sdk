import React from 'react';
import PropTypes from 'prop-types';
import { Spinner } from '@contentful/forma-36-react-components';
import WidgetContainer from './widgets/WidgetContainer.es6';
import GreetingWidget from './widgets/GreetingWidget.es6';
import ConceptVideoWidget from './widgets/ConceptVideoWidget.es6';
import { WalkthroughWidget } from './widgets/walkthrough/index.es6';
import { fetchUserState, updateUserState } from 'utils/StatePersistenceApi.es6';

const walkthroughKey = 'author_editor_space_home_walkthrough';

export default class SpaceHome extends React.Component {
  state = {
    walkthroughUserState: { isLoading: true }
  };
  static propTypes = {
    spaceName: PropTypes.string,
    orgName: PropTypes.string
  };
  async componentDidMount() {
    const {
      started,
      dismissed,
      sys: { version }
    } = await fetchUserState(walkthroughKey);
    this.setState({ walkthroughUserState: { isLoading: false, started, dismissed, version } });
  }

  updateWalkthroughState = async ({ started, dismissed }) => {
    const payload = {
      version: this.state.walkthroughUserState.version,
      started,
      dismissed
    };
    this.setState(state => ({
      walkthroughUserState: { ...state.walkthroughUserState, started, dismissed }
    }));
    const {
      sys: { version }
    } = await updateUserState(walkthroughKey, payload);
    this.setState(state => ({ walkthroughUserState: { ...state.walkthroughUserState, version } }));
  };

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
        {walkthroughUserState.isLoading ? (
          <Spinner size="large" extraClassNames="space-home-spinner" />
        ) : (
          <WalkthroughWidget
            spaceName={spaceName}
            updateWalkthroughState={this.updateWalkthroughState}
            walkthroughUserState={walkthroughUserState}
            order={walkthroughUserState.started && '3'}
          />
        )}
        <ConceptVideoWidget />
      </WidgetContainer>
    );
  }
}
