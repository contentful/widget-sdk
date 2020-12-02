import React, { useContext } from 'react';
import { css } from 'emotion';

import { Button, Note } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components/dist/alpha';
import tokens from '@contentful/forma-36-tokens';

import { SpacePurchaseState } from 'features/space-purchase/context';
import { useSpaceCreation } from 'features/space-purchase/hooks/useSpaceCreation';
import { useTemplateCreation } from 'features/space-purchase/hooks/useTemplateCreation';
import { useNavigationWarn } from 'features/space-purchase/hooks/useNavigationWarn';
import { PaymentSummary } from '../../components/PaymentSummary';
import { ReceiptMessage } from '../../components/ReceiptMessage';

const styles = {
  grid: css({
    margin: `${tokens.spacing2Xl} auto 0`,
  }),
  button: css({
    marginTop: tokens.spacingXl,
    marginBottom: tokens.spacingXl,
  }),
  templateCreationErrorNote: css({
    marginBottom: tokens.spacingXl,
  }),
  paymentSummaryContainer: css({
    maxWidth: '600px',
  }),
};

export const SpaceCreationReceiptStep = () => {
  const {
    state: { spaceName, selectedTemplate, selectedPlan },
  } = useContext(SpacePurchaseState);

  const { isCreatingSpace, spaceCreationError, buttonAction, newSpace } = useSpaceCreation(
    spaceName
  );

  const { isCreatingTemplate, templateCreationError } = useTemplateCreation(
    newSpace,
    selectedTemplate
  );

  const pending = isCreatingSpace || isCreatingTemplate;

  useNavigationWarn(selectedPlan, pending);

  return (
    <section
      aria-labelledby="new-space-receipt-section-heading"
      data-test-id="new-space-receipt-section">
      <Flex className={styles.grid} flexDirection="column" alignItems="center">
        <ReceiptMessage
          pending={pending}
          planName={selectedPlan.name}
          spaceName={spaceName}
          hasErrors={!!spaceCreationError}
        />

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
          <PaymentSummary isReceipt />
        </div>
      </Flex>
    </section>
  );
};
