import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { DisplayText, Button, Paragraph, Note } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { useCreateSpaceAndTemplate } from '../hooks/useCreateSpaceAndTemplate';
import { useNavigationWarn } from '../hooks/useNavigationWarn';
import { PaymentSummary } from './PaymentSummary';

const styles = {
  grid: css({
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
    marginBottom: tokens.spacingXl,
  }),
  templateCreationErrorNote: css({
    marginBottom: tokens.spacingXl,
  }),
  paymentSummaryContainer: css({
    maxWidth: '600px',
  }),
};

export const NewSpaceReceiptPage = ({
  organizationId,
  selectedPlan,
  selectedTemplate,
  sessionMetadata,
  spaceName,
}) => {
  const {
    pending,
    buttonAction,
    spaceCreationError,
    templateCreationError,
  } = useCreateSpaceAndTemplate(
    organizationId,
    selectedPlan,
    selectedTemplate,
    sessionMetadata,
    spaceName
  );

  useNavigationWarn(selectedPlan, pending);

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
          {pending && (
            <>
              Hang on, your new space is on its way{' '}
              <span
                role="img"
                data-test-id="receipt.loading-envelope"
                aria-label="Envelope with arrow">
                📩
              </span>
            </>
          )}
          {!pending && spaceCreationError && (
            <>
              Oh dear, we had some trouble creating your new space{' '}
              <span
                role="img"
                data-test-id="receipt.error-face"
                aria-label="Face with eyes wide open">
                😳
              </span>
            </>
          )}
          {!pending && !spaceCreationError && (
            <>
              Nice one!{' '}
              <span role="img" aria-label="Shopping bag">
                🛍
              </span>
            </>
          )}
        </DisplayText>
        <Paragraph className={styles.successMsg} testId="receipt.subtext">
          {!pending && spaceCreationError && 'Don’t worry, simply retrigger the space creation.'}
          {!pending &&
            !spaceCreationError &&
            `You successfully purchased the ${selectedPlan.name} space ${spaceName}.`}
        </Paragraph>
        <Button
          testId="receipt-page.redirect-to-new-space"
          loading={pending}
          disabled={pending}
          onClick={buttonAction}
          className={styles.button}>
          {spaceCreationError ? 'Retrigger space creation' : `Take me to ${spaceName}`}
        </Button>
        <div className={styles.paymentSummaryContainer}>
          {templateCreationError && (
            <Note
              noteType="warning"
              title="We had a problem creating your template"
              testId="receipt-page.template-creation-error"
              className={styles.templateCreationErrorNote}>
              Something happened while creating the template. You can still use your space, but some
              content from the template may be missing.
            </Note>
          )}
          <PaymentSummary selectedPlan={selectedPlan} isReceipt />
        </div>
      </Flex>
    </section>
  );
};

NewSpaceReceiptPage.propTypes = {
  spaceName: PropTypes.string.isRequired,
  selectedPlan: PropTypes.object.isRequired,
  selectedTemplate: PropTypes.object,
  organizationId: PropTypes.string.isRequired,
  sessionMetadata: PropTypes.object.isRequired,
};
