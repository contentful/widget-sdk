import { Component } from 'react';
import {
  Notification,
  Form,
  Note,
  List,
  ListItem,
  Paragraph,
  Button,
  TextField,
  Heading,
  Typography,
  TextLink
} from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import React from 'react';
import { installApp } from './InstallationProcess.es6';
import { APP_ID, DEFAULT_WRAPPER_NAME } from './Constants.es6';
import FeedbackButton from 'app/common/FeedbackButton.es6';

import * as Analytics from 'analytics/Analytics';

import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  heading: css({
    marginTop: tokens.spacingL
  }),
  installList: css({
    color: tokens.colorTextMid,
    marginBottom: tokens.spacingM,
    listStyleType: 'disc',
    marginLeft: '15px'
  }),
  installListItem: css({
    listStyleType: 'disc'
  })
};

export class ImageManagementInstaller extends Component {
  static propTypes = {
    client: PropTypes.shape({
      get: PropTypes.func.isRequired,
      save: PropTypes.func.isRequired
    }).isRequired,
    existingContentTypeNames: PropTypes.array.isRequired,
    onInstallCompleted: PropTypes.func.isRequired
  };

  constructor(props) {
    super(props);
    this.state = {
      wrapperName: DEFAULT_WRAPPER_NAME
    };
  }

  onAppInstall = async () => {
    try {
      this.setState({
        installing: true
      });

      const config = await installApp(this.state.wrapperName);

      await this.props.client.save(APP_ID, config);
      Analytics.track('aiImageManagement:installed');
      this.props.onInstallCompleted();
    } catch (e) {
      const errorMessage =
        e.name === 'InstallationError' ? e.message : `Failed to install app: ${e.message}`;
      Notification.error(errorMessage);
      this.setState({
        installing: false
      });
    }
  };

  validateWrapperName = wrapperName => {
    if (!wrapperName) {
      return 'A content type name is required';
    } else if (this.props.existingContentTypeNames.includes(wrapperName)) {
      return 'This name is already used';
    }

    return null;
  };

  onWrapperNameChange = e => {
    const wrapperName = e.target.value;

    this.setState({
      wrapperName
    });
  };

  render() {
    const wrapperNameValidationMessage = this.validateWrapperName(this.state.wrapperName);

    return (
      <div>
        <Note>
          Let us know how we can improve the AI image management app.{' '}
          <FeedbackButton target="extensibility" about="AI Image management app" />
        </Note>
        <Typography>
          <Heading className={styles.heading}>About</Heading>
          <Paragraph>
            Simplify your image management with direct image upload in entries and AI supported tag
            generation.{' '}
          </Paragraph>
          <Paragraph>Installing this app will add the following items to your space:</Paragraph>
        </Typography>
        <List className={styles.installList}>
          <ListItem className={styles.installListItem}>
            A UI extension to directly upload images in your entries
          </ListItem>
          <ListItem className={styles.installListItem}>
            A UI extension to automatically tag images
          </ListItem>
          <ListItem className={styles.installListItem}>
            A new content type to wrap assets for storing custom metadata: Title, Image and Tags
          </ListItem>
          <ListItem className={styles.installListItem}>
            Configure the new content type to use the new UI extensions
          </ListItem>
        </List>

        <TextLink
          href="https://www.contentful.com/developers/docs/extensibility/apps/ai-image-management/"
          target="_blank"
          rel="noopener noreferrer">
          Learn more in the docs
        </TextLink>
        <Typography>
          <Heading className={styles.heading}>Installation</Heading>
          <Paragraph>Choose the name for your new content type</Paragraph>
        </Typography>
        <Form spacing="condensed">
          <TextField
            name="contentTypeName"
            id="contentTypeName"
            labelText="Content type name"
            validationMessage={wrapperNameValidationMessage}
            value={this.state.wrapperName}
            onChange={this.onWrapperNameChange}
            required={true}
            textInputProps={{ disabled: this.state.installing, width: 'medium', maxLength: 64 }}
          />
          <Button
            disabled={this.state.installing || !!wrapperNameValidationMessage}
            loading={this.state.installing}
            onClick={this.onAppInstall}>
            {this.state.installing ? 'Installing ...' : 'Install app'}
          </Button>
        </Form>
      </div>
    );
  }
}
