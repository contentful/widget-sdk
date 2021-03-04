import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Paragraph, Typography, TextLink } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

import { go } from 'states/Navigator';
import { trackEvent, EVENTS } from '../utils/analyticsTracking';
import { PLATFORM_CONTENT } from '../utils/platformContent';
import { useSessionMetadata } from '../hooks/useSessionMetadata';
import { ADD_ON_PURCHASE_ERROR } from '../hooks/usePurchaseAddOn';
import { SPACE_CHANGE_ERROR } from '../hooks/useSpaceUpgrade';
import { TEMPLATE_CREATION_ERROR } from '../hooks/useTemplateCreation';

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
  newSpaceId,
  pending = true,
  error,
  isSpaceUpgrade = false,
  selectedCompose = false,
}) {
  const selectedSpacePlan = !!planName && !!spaceName && !!newSpaceId;
  const isSpaceCreation = selectedSpacePlan && !selectedCompose;
  const sessionMetadata = useSessionMetadata();

  const onClickRenameSpaceLink = () => {
    trackEvent(EVENTS.RENAME_SPACE_CLICKED, sessionMetadata);

    go({ path: ['spaces', 'detail', 'settings', 'space'], params: { spaceId: newSpaceId } });
  };

  const nonBlockingError = error?.name === TEMPLATE_CREATION_ERROR;

  let errorMessageText = '';
  if (error && !nonBlockingError) {
    errorMessageText = getErrorMessageText(error.name, {
      isSpaceUpgrade,
      selectedCompose,
      planName,
    });
  }

  return (
    <>
      <Typography className={styles.centered} testId="receipt.subtext">
        {!pending && errorMessageText && <Paragraph>{errorMessageText}</Paragraph>}

        {!pending && !errorMessageText && isSpaceCreation && (
          <Paragraph>
            You successfully purchased the {planName} space {spaceName}.
          </Paragraph>
        )}

        {!pending && !errorMessageText && selectedCompose && (
          <>
            <Paragraph>
              You successfully purchased the {PLATFORM_CONTENT.COMPOSE_AND_LAUNCH.title} package
              {isSpaceUpgrade && <> and changed your space to a {planName} space</>}
              {!isSpaceUpgrade && selectedSpacePlan && <> and a new {planName} space</>}. You can
              now install Compose and Launch on any Space Home.
            </Paragraph>
            {!isSpaceUpgrade && selectedSpacePlan && (
              <Paragraph>
                Update the new space name anytime on the{' '}
                <TextLink testId="rename-space-button" onClick={onClickRenameSpaceLink}>
                  Space Settings
                </TextLink>
              </Paragraph>
            )}
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
  newSpaceId: PropTypes.string,
  error: PropTypes.object,
  isSpaceUpgrade: PropTypes.bool,
  selectedCompose: PropTypes.bool,
};

/**
 * Helper function to get the correct error message
 *
 * @param {string} errorName - name of the Error given by a failed request
 * @param {{ isSpaceUpgrade: boolean, selectedCompose: boolean, planName: string }} options
 */
function getErrorMessageText(
  errorName,
  { isSpaceUpgrade = false, selectedCompose = false, planName }
) {
  let message = '';

  switch (errorName) {
    case SPACE_CHANGE_ERROR:
      message = selectedCompose
        ? 'only Compose + Launch has been added to your monthly bill. Please click the button below to retry changing your space size.'
        : 'nothing has been added to your monthly bill yet. Please try again by clicking the button below.';
      break;
    case ADD_ON_PURCHASE_ERROR:
      // when up/downgrading a space plan and the add on purchase fails OR if the user is only buying the add on
      // we show the user a generic message because this error blocks the user
      message =
        isSpaceUpgrade || !planName
          ? 'nothing has been added to your monthly bill yet. Please try again by clicking the button below.'
          : 'only the new space has been added to your monthly bill. Please click the button below to retry purchasing Compose + Launch.';
      break;
    default:
      message =
        'nothing has been added to your monthly bill yet. Please try again by clicking the button below.';
  }

  return `Don’t worry, ${message}`;
}
