import React from 'react';
import PropTypes from 'prop-types';
import WalkthroughComponent from './WalkthroughComponent.es6';
import { Button, IconButton, Subheading } from '@contentful/forma-36-react-components';

export default class WalkthroughWidget extends React.Component {
  state = { isTourRunning: false };
  static propTypes = {
    spaceName: PropTypes.string,
    launchButtonLabel: PropTypes.string,
    walkthroughUserState: PropTypes.shape({ started: PropTypes.bool, dismissed: PropTypes.bool }),
    updateWalkthroughState: PropTypes.func
  };

  runTour = isTourRunning => {
    this.setState({ isTourRunning });
  };

  startTour = () => {
    this.runTour(true);
    this.props.updateWalkthroughState({ started: true, dismissed: false });
  };

  dismissTour = () => {
    this.props.updateWalkthroughState({ started: true, dismissed: true });
  };

  render() {
    const { started, dismissed } = this.props.walkthroughUserState;
    return (
      <div>
        <WalkthroughComponent
          spaceName={this.props.spaceName}
          isTourRunning={this.state.isTourRunning}
          runTour={this.runTour}
        />
        {!started && !dismissed && (
          <div className="start-walkthrough-widget">
            <Button onClick={this.startTour}>{'Start Space tour'}</Button>
          </div>
        )}
        {started && !dismissed && (
          <div className="relaunch-walkthrough-widget">
            <div className="relaunch-walkthrough-widget__content">
              <Subheading>Relaunch the walkthrough tour of your Space</Subheading>
              <Button onClick={() => this.runTour(true)}>{'Relaunch tour'}</Button>
            </div>
            <IconButton
              label="Dismiss tour relaunch forever"
              iconProps={{ icon: 'Close' }}
              buttonType="muted"
              onClick={this.dismissTour}
            />
          </div>
        )}
      </div>
    );
  }
}
