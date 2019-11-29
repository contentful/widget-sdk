import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import MediaEmptyStateIllustration from 'svg/media-empty-state';
import { css } from 'emotion';

const styles = {
  container: css({
    textAlign: 'center',
    padding: tokens.spacingM
  }),
  heading: css({
    marginBottom: tokens.spacingS
  }),
  illustration: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM,
    width: '400px'
  })
};

export default class ScheduledActionsStateMessage extends Component {
  static propTypes = {
    title: PropTypes.string,
    text: PropTypes.string
  };

  render() {
    const { title, text, ...otherProps } = this.props;
    return (
      <div className={styles.container} {...otherProps}>
        <MediaEmptyStateIllustration className={styles.illustration} />
        <Heading className={styles.heading} testId="jobs-state-message-heading">
          {title}
        </Heading>
        <Paragraph>{text}</Paragraph>
      </div>
    );
  }
}
