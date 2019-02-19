import React from 'react';
import PropTypes from 'prop-types';
import { getModule } from 'NgRegistry.es6';
import { track } from 'analytics/Analytics.es6';
import * as logger from 'services/logger.es6';
import WalkthroughComponent from './WalkthroughComponent.es6';
import { Button, IconButton, Subheading, Spinner } from '@contentful/forma-36-react-components';
import { fetchUserState, updateUserState } from 'utils/StatePersistenceApi.es6';

const $state = getModule('$state');

const walkthroughKey = 'author_editor_space_home_walkthrough';
const trackingGroupId = 'author_editor_continuous_onboarding';

export default class WalkthroughWidget extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string,
    launchButtonLabel: PropTypes.string,
    setWalkthroughState: PropTypes.func
  };

  state = {
    sTourRunning: false,
    isLoading: true,
    started: undefined,
    dismissed: undefined,
    version: undefined
  };

  async componentDidMount() {
    try {
      const {
        started,
        dismissed,
        sys: { version }
      } = await fetchUserState(walkthroughKey);
      this.setState({
        started,
        dismissed,
        version
      });
      this.props.setWalkthroughState({ started });
    } catch (error) {
      logger.logError('Author and Editor Space Home ui walkthrough', {
        message: 'An error happened while fetching user state data',
        error
      });
    }
    this.setState(state => ({
      ...state,
      isLoading: false
    }));
  }

  updateWalkthroughState = async ({ started, dismissed }) => {
    try {
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
    } catch (error) {
      logger.logError('Author and Editor Space Home ui walkthrough', {
        message: 'An error happened while fetching user state data',
        error
      });
    }
  };

  runTour = isTourRunning => {
    this.setState({ isTourRunning });
  };

  startTour = () => {
    this.runTour(true);
    track('element:click', {
      elementId: `start_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: $state.current.name
    });
  };

  relaunchTour = () => {
    this.runTour(true);
    track('element:click', {
      elementId: `relaunch_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: $state.current.name
    });
  };

  dismissTour = () => {
    this.updateWalkthroughState({ started: true, dismissed: true });
    track('element:click', {
      elementId: `dismiss_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: $state.current.name
    });
  };

  render() {
    const { started, dismissed, isLoading, isTourRunning } = this.state;
    const { spaceName } = this.props;
    return isLoading ? (
      <Spinner size="large" extraClassNames="space-home-spinner" />
    ) : (
      <>
        <WalkthroughComponent
          spaceName={spaceName}
          isTourRunning={isTourRunning}
          runTour={this.runTour}
          walkthroughStarted={started}
          updateWalkthroughState={this.updateWalkthroughState}
        />
        {!started && !dismissed && (
          <div className="start-walkthrough">
            <Button onClick={this.startTour} testId="start-walkthrough-button">
              Start Space tour
            </Button>
          </div>
        )}
        {started && !dismissed && (
          <div className="relaunch-walkthrough">
            <div className="relaunch-walkthrough__content">
              <Subheading>Relaunch the walkthrough tour of your Space</Subheading>
              <Button
                extraClassNames="relaunch-walkthrough__button"
                onClick={this.relaunchTour}
                testId="relaunch-walkthrough-button">
                Relaunch tour
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
    );
  }
}
