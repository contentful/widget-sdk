import React from 'react';
import PropTypes from 'prop-types';
import { track } from 'analytics/Analytics';
import * as logger from 'services/logger';
import { getReactJoyride } from './utils';
import { WalkthroughComponent } from './WalkthroughComponent';
import { Button, IconButton, Subheading, Spinner } from '@contentful/forma-36-react-components';
import { fetchUserState, updateUserState } from 'utils/StatePersistenceApi';
import { getCurrentStateName } from 'states/Navigator';
import { styles } from './styles';

const walkthroughKey = 'author_editor_space_home_walkthrough';
const trackingGroupId = 'author_editor_continuous_onboarding';

export class WalkthroughWidget extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string.isRequired,
    setWalkthroughState: PropTypes.func.isRequired,
  };

  state = {
    isTourRunning: false,
    isLoading: true,
    started: undefined,
    dismissed: undefined,
    version: undefined,
    ReactJoyrideComponent: undefined,
  };

  async componentDidMount() {
    try {
      const [ReactJoyrideComponent, userState] = await Promise.all([
        getReactJoyride(),
        fetchUserState(walkthroughKey),
      ]);
      const {
        started,
        dismissed,
        sys: { version },
      } = userState;
      this.setState({
        ReactJoyrideComponent,
        started,
        dismissed,
        version,
      });

      this.props.setWalkthroughState(started);
    } catch (error) {
      logger.captureError(error);
    }

    this.setState({
      isLoading: false,
    });
  }

  updateWalkthroughState = async ({ started, dismissed }) => {
    try {
      const payload = {
        version: this.state.version,
        started,
        dismissed,
      };
      const {
        sys: { version },
      } = await updateUserState(walkthroughKey, payload);
      this.setState({
        started,
        dismissed,
        version,
      });
      this.props.setWalkthroughState(started);
    } catch (error) {
      logger.captureError(error);
    }
  };

  runTour = (isTourRunning) => {
    this.setState({
      isTourRunning,
    });
  };

  startTour = () => {
    this.runTour(true);
    track('element:click', {
      elementId: `start_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: getCurrentStateName(),
    });
  };

  relaunchTour = () => {
    this.runTour(true);
    track('element:click', {
      elementId: `relaunch_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: getCurrentStateName(),
    });
  };

  dismissTour = () => {
    this.updateWalkthroughState({ started: true, dismissed: true });
    track('element:click', {
      elementId: `dismiss_walkthrough_button`,
      groupId: trackingGroupId,
      fromState: getCurrentStateName(),
    });
  };

  render() {
    const { started, dismissed, isLoading, isTourRunning, ReactJoyrideComponent } = this.state;
    const { spaceName } = this.props;
    return isLoading ? (
      <Spinner size="large" className={styles.spaceHomeSpinner} testId="space-home-spinner" />
    ) : (
      <>
        {ReactJoyrideComponent && (
          <WalkthroughComponent
            spaceName={spaceName}
            isTourRunning={isTourRunning}
            runTour={this.runTour}
            walkthroughStarted={started}
            updateWalkthroughState={this.updateWalkthroughState}
            ReactJoyrideComponent={ReactJoyrideComponent}
          />
        )}
        {!started && !dismissed && (
          <div className={styles.startWalkthroughButton}>
            <Button onClick={this.startTour} testId="start-walkthrough-button">
              Start Space tour
            </Button>
          </div>
        )}
        {started && !dismissed && (
          <div className={styles.relaunchWalkthroughSection}>
            <div>
              <Subheading>Relaunch the walkthrough tour of your Space</Subheading>
              <Button
                className={styles.relaunchWalkthroughButton}
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
