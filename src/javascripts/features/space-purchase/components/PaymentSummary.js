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
  Button,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import { Price } from 'core/components/formatting';
import tokens from '@contentful/forma-36-tokens';

import { Space as SpacePropType, Plan as PlanPropType } from 'app/OrganizationSettings/PropTypes';

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
  buttons: css({
    marginTop: tokens.spacing2Xl,
  }),
};

export const PaymentSummary = ({
  selectedPlan,
  isReceipt = false,
  showButtons = false,
  onConfirm,
  onBack,
  currentSpace,
  currentPlan,
}) => {
  return (
    <Card className={styles.card} testId="order-summary.card">
      <Typography className={styles.text}>
        <Subheading className={styles.cardTitle} element="h3" testId="space-heading">
          {isReceipt ? 'Receipt' : 'Payment summary'}
        </Subheading>
        <Paragraph testId="payment-summary.message">
          {getSuccessMsg(currentSpace?.name, currentPlan?.name, selectedPlan.name, isReceipt)}
        </Paragraph>
        <List className={styles.list}>
          <ListItem testId="order-summary.selected-plan-name" className={styles.listItem}>
            <span>Space</span> <span>{selectedPlan.name}</span>
          </ListItem>
          <ListItem testId="order-summary.selected-plan-price" className={styles.listItem}>
            <span>Monthly cost</span> <Price value={selectedPlan.price} />
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
  selectedPlan: PropTypes.object.isRequired,
  isReceipt: PropTypes.bool,
  showButtons: PropTypes.bool,
  onConfirm: PropTypes.func,
  onBack: PropTypes.func,
  currentSpace: SpacePropType,
  currentPlan: PlanPropType,
};

function getSuccessMsg(currentSpaceName, currentPlanName, selectedPlanName, isReceipt) {
  let successMsg = '';

  if (currentSpaceName && currentPlanName) {
    successMsg = `You${
      isReceipt ? '’ve changed the space' : ' are changing'
    } ${currentSpaceName} from a ${currentPlanName} to a ${selectedPlanName} space`;
  } else {
    successMsg = 'Start using your new space today.';
  }

  return (successMsg += ' You will be charged monthly. You can cancel at anytime.');
}
