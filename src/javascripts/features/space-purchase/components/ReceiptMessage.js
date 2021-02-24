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
import { ADD_ON_PURCHASE_ERROR } from '../hooks/usePurchaseAddOn';
import { SPACE_CREATION_ERROR } from '../hooks/useSpaceCreation';
import { SPACE_CHANGE_ERROR } from '../hooks/useSpaceUpgrade';
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
  error = false,
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

  const errorMessageTitle = error ? getErrorMessageTitle(isSpaceUpgrade, error) : '';
  const errorMessageText = error ? getErrorMessageText(isSpaceUpgrade, selectedCompose, error) : '';

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
        {!pending && error && <>{errorMessageTitle}</>}
        {!pending && !error && (
          <>
            Nice one!{' '}
            <span role="img" aria-label="Shopping bag">
              🛍
            </span>
          </>
        )}
      </DisplayText>

      <Typography className={styles.centered} testId="receipt.subtext">
        {!pending && error && <Paragraph>{errorMessageText}</Paragraph>}

        {!pending && !error && isSpaceCreation && (
          <Paragraph>
            You successfully purchased the {planName} space {spaceName}.
          </Paragraph>
        )}

        {!pending && !error && selectedCompose && (
          <>
            <Paragraph>
              You successfully purchased the {PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package
              {isSpaceUpgrade && <> and changed your space to a {planName} space</>}
              {!isSpaceUpgrade && selectedSpacePlan && (
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
  error: PropTypes.object,
  isSpaceUpgrade: PropTypes.bool,
  selectedCompose: PropTypes.bool,
};

function getErrorMessageTitle(isSpaceUpgrade, error) {
  let message = '';
  if (isSpaceUpgrade) {
    if (error.name === ADD_ON_PURCHASE_ERROR) {
      message = 'processing your order';
    }
    if (error.name === SPACE_CHANGE_ERROR) {
      message = 'processing your space upgrade';
    }
  } else {
    // If it's not a spaceUpgrade, it's a space purchase
    if (error.name === SPACE_CREATION_ERROR) {
      message = 'processing your order';
    }
    if (error.name === ADD_ON_PURCHASE_ERROR) {
      message = 'processing your purchase of Compose + Launch';
    }
  }

  return (
    <>
      Oh dear, we had some trouble {message}{' '}
      <span role="img" data-test-id="receipt.error-face" aria-label="Face with eyes wide open">
        😳
      </span>
    </>
  );
}

function getErrorMessageText(isSpaceUpgrade, selectedCompose, error) {
  let message = '';
  if (isSpaceUpgrade) {
    if (error.name === ADD_ON_PURCHASE_ERROR) {
      message =
        'nothing has been added to your monthly bill yet. Please try again by clicking the button below.';
    }
    if (error.name === SPACE_CHANGE_ERROR) {
      if (selectedCompose) {
        message =
          'only the Compose + Launch has been added to your monthly bill. Please click the button below to retry changing your space size.';
      } else {
        message =
          'nothing has been added to your monthly bill yet. Please try again by clicking the button below.';
      }
    }
  } else {
    // If it's not a spaceUpgrade, it's a space purchase
    if (error.name === SPACE_CREATION_ERROR) {
      message =
        'nothing has been added to your monthly bill yet. Please try again by clicking the button below.';
    }
    if (error.name === ADD_ON_PURCHASE_ERROR) {
      message =
        'only the new space has been added to your monthly bill. Please click the button below to retry purchasing the Compose + Launch.';
    }
  }

  return `Don’t worry, ${message}`;
}
