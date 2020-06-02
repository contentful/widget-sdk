import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';

import ContactUsButton from 'ui/Components/ContactUsButton';

export default function NoMorePlans({ canSetupBilling }) {
  return (
    <Note>
      <span>You’re using the largest space available.</span>
      {canSetupBilling && (
        <span>
          {' '}
          <ContactUsButton noIcon isLink /> if you need higher limits.
        </span>
      )}
    </Note>
  );
}

NoMorePlans.propTypes = {
  canSetupBilling: PropTypes.bool.isRequired,
};
