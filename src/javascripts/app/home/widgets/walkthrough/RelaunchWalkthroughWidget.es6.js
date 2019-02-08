import React from 'react';
import PropTypes from 'prop-types';
import { IconButton, Subheading } from '@contentful/forma-36-react-components';
import StartWalkthroughWidget from './WalkthroughWidget.es6';

export default class RelaunchWalkthroughWidget extends React.Component {
  static propTypes = {
    spaceName: PropTypes.string
  };

  render() {
    return (
      <div className="relaunch-walkthrough-widget">
        <div className="relaunch-walkthrough-widget__content">
          <Subheading>Relaunch the walkthrough tour of your Space</Subheading>
          <StartWalkthroughWidget launchButtonLabel="Relaunch tour" />
        </div>
        <IconButton
          label="Dismiss tour relaunch forever"
          iconProps={{ icon: 'Close' }}
          buttonType="muted"
        />
      </div>
    );
  }
}
