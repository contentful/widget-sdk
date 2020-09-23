import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  DisplayText,
  Button,
  Paragraph,
  Notification,
} from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';
import { useAsync } from 'core/hooks/useAsync';
import { createSpace, createSpaceWithTemplate } from '../utils/spaceCreation';
import { go } from 'states/Navigator';

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

const createSpaceWith = (
  organizationId,
  selectedPlan,
  spaceName,
  selectedTemplate = null
) => async () => {
  try {
    let newSpace;

    if (selectedTemplate) {
      newSpace = await createSpaceWithTemplate(
        organizationId,
        selectedPlan,
        spaceName,
        selectedTemplate
      );
    } else {
      newSpace = await createSpace(organizationId, selectedPlan, spaceName);
    }

    return { newSpace };
  } catch (e) {
    // To be updated after design decision is made
    Notification.error('Space could not be created, please try again.');
  }
};

export const NewSpaceReceiptPage = ({
  spaceName,
  selectedPlan,
  organizationId,
  selectedTemplate,
}) => {
  const { isLoading, data } = useAsync(
    useCallback(createSpaceWith(organizationId, selectedPlan, spaceName, selectedTemplate), [])
  );

  const goToCreatedSpace = async () => {
    await go({
      path: ['spaces', 'detail'],
      params: { spaceId: data.newSpace.sys.id },
    });
  };

  // Button should be disabled during loading && if creating the new space failed
  const isButtonDisabled = isLoading || !data?.newSpace;

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
        <Button
          testId="receipt-page.redirect-to-new-space"
          loading={isLoading}
          disabled={isButtonDisabled}
          onClick={goToCreatedSpace}
          className={styles.button}>
          Take me to {spaceName}
        </Button>
        <PaymentSummary selectedPlan={selectedPlan} isReceipt />
      </Flex>
    </section>
  );
};

NewSpaceReceiptPage.propTypes = {
  spaceName: PropTypes.string.isRequired,
  selectedPlan: PropTypes.object.isRequired,
  selectedTemplate: PropTypes.object,
  organizationId: PropTypes.string.isRequired,
};