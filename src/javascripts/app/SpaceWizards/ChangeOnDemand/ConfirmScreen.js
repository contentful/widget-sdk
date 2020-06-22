import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { Price } from 'core/components/formatting';
import { css } from 'emotion';

const classes = {
  confirmButton: css({
    margin: '1.2em 0',
    textAlign: 'center',
  }),
  center: css({
    textAlign: 'center',
  }),
};

import { Paragraph, Typography, Heading, Button } from '@contentful/forma-36-react-components';

export default function ConfirmScreenNormal(props) {
  const {
    selectedPlan,
    space,
    changing,
    currentSpaceSubscriptionPlan,
    onConfirm,
    currentSubscriptionPrice,
  } = props;

  const currentAndSelectedPriceDiffers =
    get(currentSpaceSubscriptionPlan, 'price', 0) !== selectedPlan.price;

  return (
    <Typography testId="confirmation-screen">
      <Heading className={classes.center}>Confirm your selection</Heading>
      <Paragraph className={classes.center}>
        Make sure everything is in order before creating your space.
      </Paragraph>

      <Paragraph testId="contents">
        You’re about to change the space <em>{space.name}</em>
        {currentSpaceSubscriptionPlan ? ` from a ${currentSpaceSubscriptionPlan.name} ` : ' '}
        to a {selectedPlan.name} space type. The price of this space will{' '}
        {!currentAndSelectedPriceDiffers && 'remain the same'}
        {currentAndSelectedPriceDiffers && currentSpaceSubscriptionPlan && (
          <>
            {currentSpaceSubscriptionPlan.price === 0 && selectedPlan.price !== 0 && (
              <>
                increase to{' '}
                <strong>
                  <Price value={selectedPlan.price} />
                </strong>{' '}
                and increase
              </>
            )}

            {currentSpaceSubscriptionPlan.price !== 0 && (
              <>
                change from{' '}
                <strong>
                  <Price value={currentSpaceSubscriptionPlan.price} />
                </strong>{' '}
                to{' '}
                <strong>
                  <Price value={selectedPlan.price} />
                </strong>{' '}
                and will{' '}
                {currentSpaceSubscriptionPlan.price >= selectedPlan.price ? 'reduce' : 'increase'}
              </>
            )}
          </>
        )}
        {!currentSpaceSubscriptionPlan && currentAndSelectedPriceDiffers && (
          <>
            now be{' '}
            <strong>
              <Price value={selectedPlan.price} />
            </strong>{' '}
            and change
          </>
        )}
        {currentAndSelectedPriceDiffers && (
          <>
            {' '}
            the total price of the spaces in your organization to{' '}
            <strong>
              <Price
                unit="month"
                value={
                  currentSubscriptionPrice +
                  selectedPlan.price -
                  (currentSpaceSubscriptionPlan ? currentSpaceSubscriptionPlan.price : 0)
                }
              />
            </strong>
          </>
        )}
        .
      </Paragraph>
      <div className={classes.confirmButton}>
        <Button
          testId="confirm-button"
          disabled={changing}
          loading={changing}
          onClick={onConfirm}
          buttonType="positive">
          Confirm and change space
        </Button>
      </div>
    </Typography>
  );
}

ConfirmScreenNormal.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
  currentSpaceSubscriptionPlan: PropTypes.object,
  changing: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  space: PropTypes.object.isRequired,
  currentSubscriptionPrice: PropTypes.number.isRequired,
};
