import React, { Component } from 'react';
import {
  Button,
  List,
  Note,
  ListItem,
  Notification,
  Typography,
  Heading,
  Paragraph
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import { uninstallApp } from './InstallationProcess';
import { APP_ID } from './Constants';
import FeedbackButton from 'app/common/FeedbackButton';

import * as Analytics from 'analytics/Analytics';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  heading: css({
    marginTop: tokens.spacingL
  }),
  uninstallButton: css({
    marginTop: tokens.spacingM
  }),
  uninstallList: css({
    color: tokens.colorTextMid,
    marginLeft: '15px'
  }),
  uninstallListItem: css({
    listStyleType: 'disc'
  })
};

export class ImageManagementGettingStarted extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired,
      remove: PropTypes.func.isRequired
    }).isRequired,
    onUninstallCompleted: PropTypes.func.isRequired,
    contentTypeName: PropTypes.string.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      uninstalling: false
    };
  }

  onAppUninstall = async () => {
    this.setState({
      uninstalling: true
    });

    try {
      const appConfig = await this.props.client.get(APP_ID);

      await uninstallApp(appConfig).catch(() =>
        Notification.warning('Some elements could not be deleted and have to be removed manually')
      );

      await this.props.client.remove(APP_ID);
      Analytics.track('aiImageManagement:uninstalled');
      this.props.onUninstallCompleted();
    } catch (e) {
      this.setState({ uninstalling: false });
    }
  };

  render() {
    return (
      <div>
        <Note>
          Let us know how we can improve the AI image management app.{' '}
          <FeedbackButton target="extensibility" about="AI Image management app" />
        </Note>
        <Typography>
          <Heading className={styles.heading}>Getting started</Heading>
          <Paragraph>You now have a content type {this.props.contentTypeName}.</Paragraph>

          <Heading>Uninstall App</Heading>
        </Typography>
        <List className={styles.uninstallList}>
          <ListItem className={styles.uninstallListItem}>Removes UI extensions</ListItem>
          <ListItem className={styles.uninstallListItem}>
            Content type and entries are not deleted
          </ListItem>
        </List>
        <Button
          buttonType="negative"
          disabled={this.state.uninstalling}
          loading={this.state.uninstalling}
          className={styles.uninstallButton}
          onClick={this.onAppUninstall}>
          {this.state.uninstalling ? 'Uninstalling ...' : 'Uninstall App'}
        </Button>
      </div>
    );
  }
}
