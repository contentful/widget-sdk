import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { cx, css } from 'emotion';

import {
  Card,
  Subheading,
  Typography,
  Paragraph,
  List,
  ListItem,
  Button,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components';
import { Price } from 'core/components/formatting';
import tokens from '@contentful/forma-36-tokens';

import { SpacePurchaseState } from '../context';

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
    borderTop: BORDER,
    borderBottom: BORDER,
    margin: `${tokens.spacingM} 0`,
  }),
  listItem: css({
    display: 'flex',
    padding: `${tokens.spacingXs} 0`,
    margin: 0,
    color: tokens.colorTextMid,
    justifyContent: 'space-between',
    marginBottom: '0px',
  }),
  total: css({
    borderTop: BORDER,
    fontWeight: tokens.fontWeightDemiBold,
  }),
  buttons: css({
    marginTop: tokens.spacing2Xl,
  }),
};

export const PaymentSummary = ({ showButtons = false, onConfirm, onBack }) => {
  const {
    state: { selectedPlatform, selectedPlan },
  } = useContext(SpacePurchaseState);

  let monthlyCost = 0;
  if (selectedPlatform?.price) {
    monthlyCost += selectedPlatform.price;
  }
  if (selectedPlan?.price) {
    monthlyCost += selectedPlan.price;
  }

  return (
    <Card className={styles.card} testId="order-summary.card">
      <Typography className={styles.text}>
        <Subheading className={styles.cardTitle} element="h3" testId="space-heading">
          Order summary
        </Subheading>
        <Paragraph testId="payment-summary.message">
          You will be charged monthly and your receipt will be emailed to your account email
          address. You can cancel any time.
        </Paragraph>

        <List className={styles.list}>
          {selectedPlatform && (
            <ListItem testId="order-summary.selected-platform" className={styles.listItem}>
              <span>{selectedPlatform.title}</span> <Price value={selectedPlatform.price} />
            </ListItem>
          )}
          {selectedPlatform && selectedPlan && (
            <ListItem testId="order-summary.selected-plan" className={styles.listItem}>
              <span>{selectedPlan.name} space</span> <Price value={selectedPlan.price} />
            </ListItem>
          )}
          {!selectedPlatform && selectedPlan && (
            <ListItem testId="order-summary.selected-plan-name" className={styles.listItem}>
              <span>Space</span> <span>{selectedPlan.name}</span>
            </ListItem>
          )}
          <ListItem
            testId="order-summary.monthly-cost"
            className={cx(styles.listItem, styles.total)}>
            <span>Monthly cost</span> <Price value={monthlyCost} />
          </ListItem>
        </List>
        <Paragraph>This price does not include sales tax, if applicable.</Paragraph>

        {showButtons && (
          <Flex
            className={styles.buttons}
            justifyContent="space-between"
            testId="order-summary.buttons">
            <Button onClick={onBack} testId="order-summary.back" buttonType="muted">
              Back
            </Button>
            <Button onClick={onConfirm} testId="order-summary.confirm" buttonType="positive">
              Confirm payment
            </Button>
          </Flex>
        )}
      </Typography>
    </Card>
  );
};

PaymentSummary.propTypes = {
  showButtons: PropTypes.bool,
  onConfirm: PropTypes.func,
  onBack: PropTypes.func,
};
