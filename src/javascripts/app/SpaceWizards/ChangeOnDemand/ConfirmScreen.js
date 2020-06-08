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
  const { selectedPlan, space, changing, currentPlan, onConfirm, currentSubscriptionPrice } = props;

  return (
    <Typography>
      <Heading className={classes.center}>Confirm your selection</Heading>
      <Paragraph className={classes.center}>
        Make sure everything is in order before creating your space.
      </Paragraph>

      <Paragraph>
        <>
          You’re about to change the space <em>{space.name}</em> from a {currentPlan.name} to a{' '}
          {selectedPlan.name} space type.{' '}
        </>

        {currentPlan.price === 0 && (
          <>
            The price of this space will now be{' '}
            <strong>
              <Price value={selectedPlan.price} />
            </strong>{' '}
            and will increase
          </>
        )}
        {currentPlan.price !== 0 && currentPlan.price >= selectedPlan.price && (
          <>
            The price of this space will change from{' '}
            <strong>
              <Price value={currentPlan.price} />
            </strong>{' '}
            to{' '}
            <strong>
              <Price value={selectedPlan.price} />
            </strong>{' '}
            and will reduce
          </>
        )}
        {currentPlan.price !== 0 && currentPlan.price < selectedPlan.price && (
          <>
            The price of this space will change from{' '}
            <strong>
              <Price value={currentPlan.price} />
            </strong>{' '}
            to{' '}
            <strong>
              <Price value={selectedPlan.price} />
            </strong>{' '}
            and will increase
          </>
        )}
        <span>
          {' '}
          the total price of the spaces in your organization to{' '}
          <strong>
            <Price
              unit="month"
              value={currentSubscriptionPrice + selectedPlan.price - currentPlan.price}
            />
          </strong>
          .
        </span>
      </Paragraph>
      <div className={classes.confirmButton}>
        <Button disabled={changing} loading={changing} onClick={onConfirm} buttonType="positive">
          Confirm and change space
        </Button>
      </div>
    </Typography>
  );
}

ConfirmScreenNormal.propTypes = {
  selectedPlan: PropTypes.object.isRequired,
  currentPlan: PropTypes.object.isRequired,
  changing: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  space: PropTypes.object.isRequired,
  currentSubscriptionPrice: PropTypes.number.isRequired,
};
