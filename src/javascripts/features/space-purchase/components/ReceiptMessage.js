import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import {
  DisplayText,
  Paragraph,
  Typography,
  TextLink,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { useSessionMetadata } from '../hooks/useSessionMetadata';

import { go } from 'states/Navigator';
import { PLATFORM_CONTENT } from '../utils/platformContent';

const styles = {
  sectionHeading: css({
    fontWeight: tokens.fontWeightMedium,
    marginBottom: tokens.spacingXl,
    textAlign: 'center',
  }),
  centered: css({
    textAlign: 'center',
  }),
};

export function ReceiptMessage({
  planName,
  spaceName,
  spaceId,
  pending = true,
  hasErrors = false,
  isSpaceUpgrade = false,
  selectedCompose = false,
}) {
  const selectedSpacePlan = !!planName && !!spaceName && !!spaceId;
  const isSpaceCreation = selectedSpacePlan && !selectedCompose;
  const sessionMetadata = useSessionMetadata();

  const onClickRenameSpaceLink = () => {
    trackEvent(EVENTS.RENAME_SPACE_CLICKED, sessionMetadata);

    go({ path: ['spaces', 'detail', 'settings', 'space'], params: { spaceId } });
  };

  return (
    <>
      <DisplayText
        id="receipt-section-heading"
        element="h2"
        testId="receipt-section-heading"
        className={styles.sectionHeading}>
        {pending && (
          <>
            Hang on, {isSpaceUpgrade ? 'we’re changing your space ' : 'your order is on its way '}
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
            {isSpaceUpgrade ? 'changing your space ' : 'creating your new space '}
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
            Nice one!{' '}
            <span role="img" aria-label="Shopping bag">
              🛍
            </span>
          </>
        )}
      </DisplayText>

      <Typography className={styles.centered} testId="receipt.subtext">
        {!pending && hasErrors && (
          <Paragraph>
            Don’t worry, simply retrigger the space {isSpaceUpgrade ? 'change' : 'creation'}.
          </Paragraph>
        )}

        {!pending && !hasErrors && isSpaceCreation && (
          <Paragraph>
            You successfully purchased the {planName} space {spaceName}.
          </Paragraph>
        )}

        {!pending && !hasErrors && selectedCompose && (
          <>
            <Paragraph>
              You successfully purchased the {PLATFORM_CONTENT.composePlatform.title} package
              {selectedSpacePlan && (
                <>
                  {' '}
                  and a new {planName} space. Update the new space name anytime on the{' '}
                  <TextLink testId="rename-space-button" onClick={onClickRenameSpaceLink}>
                    Space Settings
                  </TextLink>
                </>
              )}
              .
            </Paragraph>
            <Paragraph>You can now install Compose and Launch on any Space Home.</Paragraph>
          </>
        )}
      </Typography>
    </>
  );
}

ReceiptMessage.propTypes = {
  pending: PropTypes.bool,
  planName: PropTypes.string,
  spaceName: PropTypes.string,
  spaceId: PropTypes.string,
  hasErrors: PropTypes.bool,
  isSpaceUpgrade: PropTypes.bool,
  selectedCompose: PropTypes.bool,
};
