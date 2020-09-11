import React from 'react';
import PropTypes from 'prop-types';
import cn from 'classnames';
import { css } from 'emotion';

import {
  Button,
  Card,
  Heading,
  Icon,
  List,
  ListItem,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';
import { SPACE_PURCHASE_TYPES } from '../utils/spacePurchaseContent';
import { websiteUrl } from 'Config';
import tokens from '@contentful/forma-36-tokens';

const MEDIUM_PLAN_COLOR = '#14D997';
const LARGE_PLAN_COLOR = '#0BAA75';
const COMMUNITY_COLOR = tokens.colorBlueMid;

const styles = {
  // CSS for Card layout
  card: css({
    display: 'grid',
    gridTemplateRows: '1fr auto 2fr',
    padding: `${tokens.spacingXl} ${tokens.spacingL}`,
    borderRadius: '4px',
  }),
  spaceColor: {
    [SPACE_PURCHASE_TYPES.MEDIUM]: getSpaceColorCSS(MEDIUM_PLAN_COLOR),
    [SPACE_PURCHASE_TYPES.LARGE]: getSpaceColorCSS(LARGE_PLAN_COLOR),
    [SPACE_PURCHASE_TYPES.ENTERPRISE]: getSpaceColorCSS(COMMUNITY_COLOR),
  },
  // CSS for card content
  cardTitle: css({
    fontWeight: tokens.fontWeightNormal,
    '& b': {
      fontWeight: tokens.fontWeightMedium,
    },
  }),
  centered: css({
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  }),
  price: css({
    lineHeight: tokens.lineHeightCondensed,
    '& b': {
      fontSize: tokens.fontSize2Xl,
      fontWeight: tokens.fontWeightMedium,
    },
  }),
  limitsSection: css({
    marginTop: tokens.spacingL,
  }),
  limit: css({
    display: 'flex',
    alignItems: 'start',
    marginBottom: tokens.spacingM,
    '&:last-child': {
      marginBottom: 0,
    },
  }),
  check: css({
    marginRight: tokens.spacingXs,
    height: '22px', // necessary to align icon with the line-height of the text
    flexShrink: 0, // necessary to avoid icon being shrank by the text
  }),
  checkColor: {
    [SPACE_PURCHASE_TYPES.MEDIUM]: css({ fill: MEDIUM_PLAN_COLOR }),
    [SPACE_PURCHASE_TYPES.LARGE]: css({ fill: LARGE_PLAN_COLOR }),
    [SPACE_PURCHASE_TYPES.ENTERPRISE]: css({ fill: COMMUNITY_COLOR }),
  },
};

export const SpaceCard = ({ content, handleSelect }) => {
  const isEnterpriseCard = content.type === SPACE_PURCHASE_TYPES.ENTERPRISE;

  return (
    <Card className={cn(styles.card, styles.spaceColor[content.type])} testId="space-card">
      <Typography className={styles.centered}>
        <Heading element="h3" className={styles.cardTitle} testId="space-heading">
          {content.title}
        </Heading>

        <Paragraph testId="space-description">{content.description}</Paragraph>
      </Typography>

      <Typography className={styles.centered}>
        <Paragraph className={styles.price} testId="space-price">
          {content.price}
        </Paragraph>
        {isEnterpriseCard ? (
          <Button
            href={websiteUrl('contact/sales/')}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleSelect}
            testId="select-space-cta">
            {content.callToAction}
          </Button>
        ) : (
          <Button onClick={handleSelect} testId="select-space-cta">
            {content.callToAction}
          </Button>
        )}
      </Typography>

      <div className={styles.limitsSection}>
        <Typography>
          <Paragraph>{content.limitsTitle}</Paragraph>
        </Typography>
        <List testId="space-limits">
          {content.limits.map((limit, idx) => (
            <ListItem key={idx} className={styles.limit}>
              <Icon
                icon="CheckCircle"
                className={cn(styles.check, styles.checkColor[content.type])}
              />
              <Paragraph>{limit}</Paragraph>
            </ListItem>
          ))}
        </List>
      </div>
    </Card>
  );
};
SpaceCard.propTypes = {
  content: PropTypes.shape({
    type: PropTypes.string,
    title: PropTypes.element,
    description: PropTypes.string,
    price: PropTypes.element,
    callToAction: PropTypes.string,
    limitsTitle: PropTypes.string,
    limits: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
  handleSelect: PropTypes.func.isRequired,
};

function getSpaceColorCSS(backgroundColor) {
  return css({
    position: 'relative',
    overflow: 'hidden',
    '&:after': {
      content: '""', // we need to pass "" to content here or it does not render
      position: 'absolute',
      top: 0,
      width: '100%',
      height: tokens.spacingXs,
      backgroundColor,
    },
  });
}
