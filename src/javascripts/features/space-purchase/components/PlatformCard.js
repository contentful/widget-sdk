import React from 'react';
import { css } from 'emotion';
import PropTypes from 'prop-types';

import {
  Card,
  Heading,
  Paragraph,
  SkeletonContainer,
  SkeletonImage,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { PinLabel } from './PinLabel';

const styles = {
  card: css({
    display: 'grid',
    gridTemplateRows: '70px auto 1fr auto',
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }),
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
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
    <Card className={styles.card} padding="large" selected={selected} onClick={handleClick}>
      {/** TODO: replace skeletons with final illustration */}
      <SkeletonContainer svgWidth={70} svgHeight={70}>
        <SkeletonImage />
      </SkeletonContainer>

      <Heading element="h3" className={styles.mediumWeight}>
        {content.title}
      </Heading>

      <Paragraph>{content.description}</Paragraph>

      {/** TODO: replace price with data from GK once it’s ready */}
      {content.price ? (
        <Paragraph className={styles.price} testId="platform-price">
          $<b>{content.price}</b>
          <br />
          /month
        </Paragraph>
      ) : (
        <PinLabel label="Your current package" />
      )}
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
