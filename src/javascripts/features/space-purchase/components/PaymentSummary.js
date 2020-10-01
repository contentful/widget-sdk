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
  card: css({
    padding: tokens.spacingXl,
    borderRadius: '4px',
  }),
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
    padding: `${tokens.spacingXs} 0`,
    margin: 0,
    color: tokens.colorTextMid,
    justifyContent: 'space-between',
    borderTop: BORDER,
    fontWeight: tokens.fontWeightDemiBold,
    marginBottom: '0px',
  }),
};

export const PaymentSummary = ({ selectedPlan, grandTotal = 0, isReceipt = false }) => {
  return (
    <Card className={styles.card} testId="order-summary.card">
      <Typography className={styles.text}>
        <Subheading className={styles.cardTitle} element="h3" testId="space-heading">
          {isReceipt ? 'Receipt' : 'Payment summary'}
        </Subheading>
        <Paragraph>
          Start using your new space today. You will be charged monthly. You can cancel at anytime.
        </Paragraph>
        <List className={styles.list}>
          <ListItem testId="order-summary.selected-plan-name" className={styles.listItem}>
            <span>Space</span> <span>{selectedPlan.name}</span>
          </ListItem>
          <ListItem testId="order-summary.selected-plan-price" className={styles.listItem}>
            <span>Monthly {isReceipt ? 'total' : 'cost'}</span>{' '}
            <Price value={isReceipt ? grandTotal : selectedPlan.price} />
          </ListItem>
        </List>
        <Paragraph>This price does not include sales tax, if applicable.</Paragraph>
      </Typography>
    </Card>
  );
};

PaymentSummary.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
  grandTotal: PropTypes.number,
  isReceipt: PropTypes.bool,
};
