import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import { Card, Heading, Paragraph, Typography } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { CurrentSpaceLabel } from './CurrentSpaceLabel';

const styles = {
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  centeredText: css({
    textAlign: 'center',
  }),
  price: css({
    lineHeight: tokens.lineHeightCondensed,
    '& b': {
      fontSize: tokens.fontSize2Xl,
      fontWeight: tokens.fontWeightMedium,
    },
  }),
};

export const PlatformCard = ({ handleClick, selected = false, content }) => {
  return (
    <Card className={styles.centeredText} padding="large" selected={selected} onClick={handleClick}>
      <Typography>
        <Heading element="h3" className={styles.mediumWeight}>
          {content.title}
        </Heading>
        <Paragraph>{content.description}</Paragraph>

        {content.price ? (
          <Paragraph className={styles.price} testId="platform-price">
            $<b>{content.price}</b>
            <br />
            /month
          </Paragraph>
        ) : (
          <CurrentSpaceLabel />
        )}
      </Typography>
    </Card>
  );
};

PlatformCard.propTypes = {
  handleClick: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  content: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number,
  }).isRequired,
};
