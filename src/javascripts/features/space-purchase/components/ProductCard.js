import React from 'react';
import { cx, css, keyframes } from 'emotion';
import PropTypes from 'prop-types';

import {
  Card,
  Heading,
  Paragraph,
  Icon,
  List,
  ListItem,
  SkeletonContainer,
  SkeletonImage,
  SkeletonBodyText,
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
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
    opacity: 1,
    transition: 'opacity 0.2s ease-in-out',
  }),
  platform: css({
    gridTemplateRows: '70px auto 1fr auto',
  }),
  spacePlan: css({
    gridTemplateRows: 'auto 1fr auto 2fr',
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

  limitsSection: css({
    justifySelf: 'flex-start',
    textAlign: 'left',
    marginTop: tokens.spacingXl,
  }),
  limitsList: css({
    marginTop: tokens.spacingXs,
  }),
  listItem: css({
    display: 'flex',
  }),
  check: css({
    flex: '0 0 18px', // necessary or the check will shrink
    marginTop: '2px', // necessary to center the check with the line height of the text
    marginRight: tokens.spacingXs,
  }),

  disabled: css({
    opacity: 0.3,
    pointerEvents: 'none',
  }),
};

export const ProductCard = ({
  onClick,
  loading = false,
  disabled = false,
  selected = false,
  content,
  isNew = false,
  cardType = 'space',
  testId = 'product-card',
}) => {
  return (
    <Card
      className={cx(styles.card, {
        [styles.spacePlan]: cardType === 'space',
        [styles.platform]: cardType === 'platform',
        [styles.newTag]: isNew,
        [styles.disabled]: disabled,
      })}
      padding="large"
      selected={selected}
      onClick={onClick}
      testId={testId}>
      {/** TODO: replace skeletons with final illustration */}
      {cardType === 'platform' && (
        <SkeletonContainer svgWidth={70} svgHeight={70}>
          <SkeletonImage />
        </SkeletonContainer>
      )}

      <Heading element="h3" className={styles.mediumWeight}>
        {content.title}
      </Heading>

      <Paragraph>{content.description}</Paragraph>

      {loading && (
        <SkeletonContainer svgHeight={52}>
          <SkeletonBodyText lineHeight={16} numberOfLines={2} />
        </SkeletonContainer>
      )}
      {!loading && !content.price && cardType === 'platform' && (
        <PinLabel labelText="Your current package" />
      )}
      {!loading && content.price != undefined && (
        <Paragraph className={styles.price} testId="product-price">
          {content.price === 0 ? (
            <>
              <b>Free</b>
              <br />
              forever
            </>
          ) : (
            <>
              $<b>{content.price}</b>
              <br />
              /month
            </>
          )}
        </Paragraph>
      )}

      {content.limits && (
        <div className={styles.limitsSection}>
          <Paragraph>What are the space limits:</Paragraph>
          <List className={styles.limitsList} testId="space-limits">
            {content.limits.map((limit, idx) => (
              <ListItem key={idx} className={cx(styles.listItem, styles.textLeft)}>
                <Icon icon="CheckCircle" color="positive" className={styles.check} />
                <Paragraph>{limit}</Paragraph>
              </ListItem>
            ))}
          </List>
        </div>
      )}
    </Card>
  );
};

ProductCard.propTypes = {
  cardType: PropTypes.oneOf(['platform', 'space']),
  onClick: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  selected: PropTypes.bool,
  isNew: PropTypes.bool,
  content: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number,
    limits: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  testId: PropTypes.string,
};
