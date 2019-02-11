import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import WalkthroughComponent from './WalkthroughComponent.es6';
import { Button, IconButton, Subheading, Spinner } from '@contentful/forma-36-react-components';
import { fetchUserState, updateUserState } from 'utils/StatePersistenceApi.es6';

const $state = getModule('$state');

const walkthroughKey = 'author_editor_space_home_walkthrough';

export default class WalkthroughWidget extends React.Component {
  state = { isTourRunning: false };
  static propTypes = {
    spaceName: PropTypes.string,
    launchButtonLabel: PropTypes.string,
    setWalkthroughState: PropTypes.func
  };

  state = {
    isLoading: true,
    started: undefined,
    dismissed: undefined,
    version: undefined
  };

  async componentDidMount() {
    const {
      started,
      dismissed,
      sys: { version }
    } = await fetchUserState(walkthroughKey);
    this.setState({
      started,
      dismissed,
      version,
      isLoading: false
    });
    this.props.setWalkthroughState({ started });
  }

  updateWalkthroughState = async ({ started, dismissed }) => {
    const payload = {
      version: this.state.version,
      started,
      dismissed
    };
    const {
      sys: { version }
    } = await updateUserState(walkthroughKey, payload);
    this.setState(state => ({
      ...state,
      started,
      dismissed,
      version
    }));
    this.props.setWalkthroughState({ started });
  };

  runTour = isTourRunning => {
    this.setState({ isTourRunning });
  };

  startTour = () => {
    this.runTour(true);
    this.updateWalkthroughState({ started: true, dismissed: false });
    track('element:click', {
      elementId: `start-walkthrough-button`,
      groupId: 'author_editor_continuous_onboarding',
      fromState: $state.current.name
    });
  };

  relaunchTour = () => {
    this.runTour(true);
    track('element:click', {
      elementId: `relaunch-walkthrough-button`,
      groupId: 'author_editor_continuous_onboarding',
      fromState: $state.current.name
    });
  };

  dismissTour = () => {
    this.updateWalkthroughState({ started: true, dismissed: true });
    track('element:click', {
      elementId: `dismiss-walkthrough-button`,
      groupId: 'author_editor_continuous_onboarding',
      fromState: $state.current.name
    });
  };

  render() {
    const { started, dismissed, isLoading } = this.state;
    return (
      <>
        {isLoading ? (
          <Spinner size="large" extraClassNames="space-home-spinner" />
        ) : (
          <>
            <WalkthroughComponent
              spaceName={this.props.spaceName}
              isTourRunning={this.state.isTourRunning}
              runTour={this.runTour}
            />
            {!started && !dismissed && (
              <div className="start-walkthrough">
                <Button onClick={this.startTour} testId="start-walkthrough-button">
                  {'Start Space tour'}
                </Button>
              </div>
            )}
            {started && !dismissed && (
              <div className="relaunch-walkthrough">
                <div className="relaunch-walkthrough__content">
                  <Subheading>Relaunch the walkthrough tour of your Space</Subheading>
                  <Button onClick={this.relaunchTour} testId="relaunch-walkthrough-button">
                    {'Relaunch tour'}
                  </Button>
                </div>
                <IconButton
                  label="Dismiss tour relaunch forever"
                  iconProps={{ icon: 'Close' }}
                  buttonType="muted"
                  onClick={this.dismissTour}
                  testId="dismiss-walkthrough-button"
                />
              </div>
            )}
          </>
        )}
      </>
    );
  }
}
