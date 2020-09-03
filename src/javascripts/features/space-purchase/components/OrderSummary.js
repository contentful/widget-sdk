import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  Card,
  Subheading,
  Typography,
  Paragraph,
  List,
  ListItem,
} from '@contentful/forma-36-react-components';
import { Price } from 'core/components/formatting';
import tokens from '@contentful/forma-36-tokens';

const BORDER = `1px solid ${tokens.colorElementMid}`;

const styles = {
  text: css({
    '& > p:last-child': {
      marginBottom: 0,
    },
  }),
  cardTitle: css({
    marginBottom: tokens.spacingL,
  }),
  list: css({
    borderBottom: BORDER,
    margin: `${tokens.spacingM} 0`,
  }),
  listItem: css({
    display: 'flex',
    padding: `${tokens.spacingS} 0`,
    color: tokens.colorTextMid,
    justifyContent: 'space-between',
    borderTop: BORDER,
    fontWeight: tokens.fontWeightDemiBold,
  }),
};

export const OrderSummary = ({ selectedPlan }) => {
  return (
    <Card testId="order-summary.card">
      <Typography className={styles.text}>
        <Subheading className={styles.cardTitle} element="h3" testId="space-heading">
          Order Summary
        </Subheading>
        <Paragraph>
          Start using your new space today. You will be billed at the end of each month. You can
          cancel at anytime.
        </Paragraph>
        <List className={styles.list}>
          <ListItem testId="order-summary.selected-plan-name" className={styles.listItem}>
            <span>Space</span> <span>{selectedPlan.name}</span>
          </ListItem>
          <ListItem testId="order-summary.selected-plan-price" className={styles.listItem}>
            <span>Monthly Total:</span> <Price value={selectedPlan.price} />
          </ListItem>
        </List>
        <Paragraph>This price is not inclusive of sales tax, if applicable.</Paragraph>
      </Typography>
    </Card>
  );
};

OrderSummary.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
};
