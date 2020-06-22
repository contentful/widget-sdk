import React from 'react';
import PropTypes from 'prop-types';
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

  return (
    <Typography testId="confirmation-screen">
      <Heading className={classes.center}>Confirm your selection</Heading>
      <Paragraph className={classes.center}>
        Make sure everything is in order before creating your space.
      </Paragraph>

      <Paragraph testId="contents">
        <>
          You’re about to change the space <em>{space.name}</em> from a{' '}
          {currentSpaceSubscriptionPlan.name} to a {selectedPlan.name} space type.{' '}
        </>

        {currentSpaceSubscriptionPlan.price === 0 && (
          <>
            The price of this space will now be{' '}
            <strong>
              <Price value={selectedPlan.price} />
            </strong>{' '}
            and will increase
          </>
        )}
        {currentSpaceSubscriptionPlan.plan !== 0 && (
          <>
            The price of this space will change from{' '}
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
        <span>
          {' '}
          the total price of the spaces in your organization to{' '}
          <strong>
            <Price
              unit="month"
              value={
                currentSubscriptionPrice + selectedPlan.price - currentSpaceSubscriptionPlan.price
              }
            />
          </strong>
          .
        </span>
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
  currentSpaceSubscriptionPlan: PropTypes.object.isRequired,
  changing: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  space: PropTypes.object.isRequired,
  currentSubscriptionPrice: PropTypes.number.isRequired,
};
