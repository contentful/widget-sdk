import React from 'react';
import { cx, css } from 'emotion';
import PropTypes from 'prop-types';

import {
  Card,
  Heading,
  Paragraph,
  Icon,
  List,
  ListItem,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  card: css({
    position: 'relative',
    display: 'grid',
    gridTemplateRows: 'auto 1fr auto 2fr', // TODO: this is the only different style compared to PlatformCard
    rowGap: tokens.spacingXs,
    justifyItems: 'center',
    alignItems: 'center',
    textAlign: 'center',
  }),
  // TODO: same as in PlatformCard, consider refactoring
  mediumWeight: css({
    fontWeight: tokens.fontWeightMedium,
  }),
  // TODO: same as in PlatformCard, consider refactoring
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
};

/**
 * TODO: to make it generic for platform and space plan we need:
 * - New! tag
 * - handle illustration
 * - to deal with <PinLabel />
 */

export const SpacePlanCard = ({ onClick, selected = false, content }) => {
  return (
    <Card
      className={styles.card}
      padding="large"
      selected={selected}
      onClick={onClick}
      testId="space-plan-card">
      <Heading element="h3" className={styles.mediumWeight}>
        {content.title}
      </Heading>

      <Paragraph>{content.description}</Paragraph>

      {content.price !== undefined && (
        <Paragraph className={styles.price} testId="space-plan-price">
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

SpacePlanCard.propTypes = {
  onClick: PropTypes.func.isRequired,
  selected: PropTypes.bool,
  content: PropTypes.shape({
    title: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    price: PropTypes.number,
    limits: PropTypes.arrayOf(PropTypes.string),
  }).isRequired,
};
