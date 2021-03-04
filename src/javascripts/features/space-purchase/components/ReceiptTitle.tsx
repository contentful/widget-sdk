import React from 'react';
import { css } from 'emotion';
import { DisplayText } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { TEMPLATE_CREATION_ERROR } from '../hooks/useTemplateCreation';
import { SPACE_CHANGE_ERROR } from '../hooks/useSpaceUpgrade';
import { ADD_ON_PURCHASE_ERROR } from '../hooks/usePurchaseAddOn';

const styles = {
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXl,
    textAlign: 'center',
  }),
};

interface ReceiptTitleProps {
  pending?: boolean;
  isSpaceUpgrade?: boolean;
  error?: Error;
}

export function ReceiptTitle({ pending = true, isSpaceUpgrade = false, error }: ReceiptTitleProps) {
  const nonBlockingError = error && error.name === TEMPLATE_CREATION_ERROR;

  return (
    <DisplayText element="h2" testId="receipt-section-heading" className={styles.sectionHeading}>
      {pending && (
        <>
          Hang on, {isSpaceUpgrade ? 'we’re changing your space ' : 'your order is on its way '}
          <span role="img" data-test-id="receipt.loading-envelope" aria-label="Envelope with arrow">
            📩
          </span>
        </>
      )}

      {/* if it's a non-blocking error (e.g. template creation error) we show the success message */}
      {!pending && (!error || nonBlockingError) && (
        <>
          Nice one!{' '}
          <span role="img" aria-label="Shopping bag">
            🛍
          </span>
        </>
      )}

      {!pending && error && !nonBlockingError && (
        <ErrorTitle errorName={error.name} isSpaceUpgrade={isSpaceUpgrade} />
      )}
    </DisplayText>
  );
}

interface ErrorTitleProps {
  isSpaceUpgrade?: boolean;
  errorName: string;
}

function ErrorTitle({ isSpaceUpgrade = false, errorName }: ErrorTitleProps) {
  let message = '';

  switch (errorName) {
    case SPACE_CHANGE_ERROR:
      message = 'processing your space upgrade ';
      break;
    case ADD_ON_PURCHASE_ERROR:
      // when up/downgrading a space plan and the add on purchase fails
      // we show the user a generic message because this error blocks the space change
      message = isSpaceUpgrade
        ? 'processing your order '
        : 'processing your purchase of Compose + Launch ';
      break;
    default:
      message = 'processing your order ';
  }

  return (
    <>
      Oh dear, we had some trouble {message}
      <span role="img" data-test-id="receipt.error-face" aria-label="Face with eyes wide open">
        😳
      </span>
    </>
  );
}
