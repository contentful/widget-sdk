import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { DisplayText, Button, Paragraph } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { PaymentSummary } from './PaymentSummary';

const styles = {
  grid: css({
    maxWidth: '470px',
    margin: `${tokens.spacing2Xl} auto 0`,
  }),
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
  }),
  successMsg: css({
    marginBottom: tokens.spacingXl,
  }),
  button: css({
    marginBottom: tokens.spacing2Xl,
  }),
};

export const NewSpaceReceiptPage = ({ spaceName, selectedPlan }) => {
  return (
    <section
      aria-labelledby="new-space-receipt-section-heading"
      data-test-id="new-space-receipt-section">
      <Flex className={styles.grid} flexDirection="column" alignItems="center">
        <DisplayText
          id="new-space-receipt-section-heading"
          element="h2"
          testId="new-space-receipt-section-heading"
          className={styles.sectionHeading}>
          Nice one!{' '}
          <span role="img" aria-label="Shopping bag">
            🛍
          </span>
        </DisplayText>
        <Paragraph className={styles.successMsg} testId="new-space-receipt-success">
          You successfully purchased the {selectedPlan.name} space {spaceName}.
        </Paragraph>
        {/* TODO: pass the function that takes the user to Space Home to this button */}
        <Button className={styles.button}>Take me to {spaceName}</Button>
        <PaymentSummary selectedPlan={selectedPlan} isReceipt />
      </Flex>
    </section>
  );
};

NewSpaceReceiptPage.propTypes = {
  spaceName: PropTypes.string.isRequired,
  selectedPlan: PropTypes.object.isRequired,
};
