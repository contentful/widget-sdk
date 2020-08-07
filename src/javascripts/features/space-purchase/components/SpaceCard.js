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
import tokens from '@contentful/forma-36-tokens';

const styles = {
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
  card: css({
    display: 'grid',
    gridTemplateRows: '1fr auto auto',
    position: 'relative',
    padding: `${tokens.spacingXl} ${tokens.spacingL}`,
    overflow: 'hidden',
    '&:before': {
      content: '""',
      position: 'absolute',
      width: '100%',
      height: tokens.spacingXs,
      top: 0,
      left: 0,
    },
  }),
  spaceColor: {
    medium: getPlanBGColor(tokens.colorGreenLight),
    large: getPlanBGColor(tokens.colorGreenMid),
    enterprise: getPlanBGColor(tokens.colorBlueMid),
  },
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
    medium: css({ fill: tokens.colorGreenLight }),
    large: css({ fill: tokens.colorGreenMid }),
    enterprise: css({ fill: tokens.colorBlueMid }),
  },
};

export const SpaceCard = ({ content, handleSelect }) => {
  return (
    <Card className={cn(styles.card, styles.spaceColor[content.type])}>
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
        <Button onClick={handleSelect} testId="space-cta">
          {content.callToAction}
        </Button>
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

function getPlanBGColor(backgroundColor) {
  return css({
    '&:before': {
      backgroundColor,
    },
  });
}
