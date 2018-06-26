import React from 'react';
import PropTypes from 'prop-types';

import ContactUsButton from 'ui/Components/ContactUsButton';

export const NoMorePlans = ({ canSetupBilling }) => {
  return <div className='note-box--info create-space-wizard__info'>
    <p>
      <span>You&apos;re using the largest space available.</span>
      { canSetupBilling &&
        <span>&#32;<ContactUsButton noIcon /> if you need higher limits.</span>
      }
    </p>
  </div>;
};

NoMorePlans.propTypes = {
  canSetupBilling: PropTypes.bool.isRequired
};
