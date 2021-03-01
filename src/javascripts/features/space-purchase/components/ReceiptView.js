import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Button, Note } from '@contentful/forma-36-react-components';
import { Flex } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { TEMPLATE_CREATION_ERROR } from '../hooks/useTemplateCreation';

import { PaymentSummary } from './PaymentSummary';
import { ReceiptMessage } from './ReceiptMessage';

const styles = {
  grid: css({
    margin: `${tokens.spacing2Xl} auto 0`,
    maxWidth: '600px',
  }),
  button: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingXl,
  }),
  templateCreationErrorNote: css({
    marginBottom: tokens.spacingXl,
  }),
};

export function ReceiptView({
  pending,
  planName,
  spaceName,
  spaceId,
  buttonAction,
  error,
  isSpaceUpgrade,
  selectedCompose,
}) {
  let buttonLabel = 'Go to my space home';
  if (error && error.name !== TEMPLATE_CREATION_ERROR) {
    buttonLabel = 'Retry';
  }

  return (
    <Flex className={styles.grid} flexDirection="column" alignItems="center">
      <ReceiptMessage
        pending={pending}
        planName={planName}
        spaceName={spaceName}
        spaceId={spaceId}
        error={error}
        isSpaceUpgrade={isSpaceUpgrade}
        selectedCompose={selectedCompose}
      />

      <Button
        testId="receipt-page.redirect-to-space"
        loading={pending}
        disabled={pending}
        onClick={buttonAction}
        className={styles.button}>
        {buttonLabel}
      </Button>

      {error && error.name === TEMPLATE_CREATION_ERROR && (
        <Note
          noteType="warning"
          title="We had a problem creating your template"
          testId="receipt-page.template-creation-error"
          className={styles.templateCreationErrorNote}>
          Something happened while creating the template. You can still use your space, but some
          content from the template may be missing.
        </Note>
      )}

      <PaymentSummary />
    </Flex>
  );
}

ReceiptView.propTypes = {
  pending: PropTypes.bool,
  planName: PropTypes.string,
  spaceName: PropTypes.string,
  spaceId: PropTypes.string,
  buttonAction: PropTypes.func,
  error: PropTypes.object,
  isSpaceUpgrade: PropTypes.bool,
  selectedCompose: PropTypes.bool,
};
