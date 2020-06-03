import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import MediaEmptyStateIllustration from 'svg/media-empty-state.svg';
import { Heading, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  container: css({
    textAlign: 'center',
    padding: tokens.spacingM,
  }),
  heading: css({
    marginBottom: tokens.spacingS,
  }),
  illustration: css({
    marginBottom: tokens.spacingM,
    marginTop: tokens.spacingM,
    width: '400px',
  }),
};

const ReleasesEmptyStateMessage = ({ title, text, ...otherProps }) => {
  return (
    <div className={styles.container} {...otherProps}>
      <MediaEmptyStateIllustration className={styles.illustration} />
      <Heading className={styles.heading} testId="releases-state-message-heading">
        {title}
      </Heading>
      <Paragraph>{text}</Paragraph>
    </div>
  );
};

ReleasesEmptyStateMessage.propTypes = {
  title: PropTypes.string,
  text: PropTypes.string,
};

export default ReleasesEmptyStateMessage;
