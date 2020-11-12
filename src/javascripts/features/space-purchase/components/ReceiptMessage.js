import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { DisplayText, Paragraph } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXs,
  }),
};

export function ReceiptMessage({
  planName,
  spaceName,
  pending = true,
  hasErrors = false,
  isUpgrade = false,
}) {
  const isSpaceCreation = !!planName && !!spaceName;
  return (
    <>
      <DisplayText
        id="receipt-section-heading"
        element="h2"
        testId="receipt-section-heading"
        className={styles.sectionHeading}>
        {pending && (
          <>
            Hang on, {isUpgrade ? 'we’re changing your space ' : 'your new space is on its way '}
            <span
              role="img"
              data-test-id="receipt.loading-envelope"
              aria-label="Envelope with arrow">
              📩
            </span>
          </>
        )}
        {!pending && hasErrors && (
          <>
            Oh dear, we had some trouble{' '}
            {isUpgrade ? 'changing your space ' : 'creating your new space '}
            <span
              role="img"
              data-test-id="receipt.error-face"
              aria-label="Face with eyes wide open">
              😳
            </span>
          </>
        )}
        {!pending && !hasErrors && (
          <>
            Nice one!
            <span role="img" aria-label="Shopping bag">
              🛍
            </span>
          </>
        )}
      </DisplayText>
      {!pending && (
        <Paragraph testId="receipt.subtext">
          {hasErrors &&
            `Don’t worry, simply retrigger the space ${isUpgrade ? 'change' : 'creation'}.`}
          {isSpaceCreation &&
            !hasErrors &&
            `You successfully purchased the ${planName} space ${spaceName}.`}
        </Paragraph>
      )}
    </>
  );
}

ReceiptMessage.propTypes = {
  pending: PropTypes.bool,
  planName: PropTypes.string,
  spaceName: PropTypes.string,
  hasErrors: PropTypes.bool,
  isUpgrade: PropTypes.bool,
};
