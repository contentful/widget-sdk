import React from 'react';
import cn from 'classnames';
import { css, keyframes } from 'emotion';
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

const pulse = keyframes({
  from: {
    boxShadow: '0px 0px 10px 0px rgb(46, 117, 212, 0)',
  },
  to: {
    boxShadow: '0px 0px 10px 5px rgb(46, 117, 212, 0.65)',
  },
});

const styles = {
  card: css({
    position: 'relative',
    display: 'grid',
    gridTemplateRows: '70px auto 1fr auto',
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }),
  newTag: css({
    '&:before': {
      content: '"New!"',
      backgroundColor: tokens.colorBlueMid,
      position: 'absolute',
      top: '-13px',
      color: tokens.colorWhite,
      fontWeight: tokens.fontWeightNormal,
      padding: `${tokens.spacing2Xs} ${tokens.spacingL}`,
      borderRadius: tokens.spacingL,
      textTransform: 'uppercase',
      fontSize: tokens.fontSizeS,
      animation: `${pulse} 700ms ease alternate infinite`,
    },
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

export const PlatformCard = ({ onClick, selected = false, isNew = false, content }) => {
  return (
    <Card
      className={cn(styles.card, { [styles.newTag]: isNew })}
      padding="large"
      selected={selected}
      onClick={onClick}
      testId="platform-card">
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
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  isNew: PropTypes.bool,
  content: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number,
  }).isRequired,
};
