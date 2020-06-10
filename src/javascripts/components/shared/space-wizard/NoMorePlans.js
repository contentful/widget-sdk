import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';

import ContactUsButton from 'ui/Components/ContactUsButton';

export default function NoMorePlans({ canSetupBilling = false }) {
  return (
    <Note noteType="primary">
      You’re using the largest space available.
      {canSetupBilling && (
        <>
          {' '}
          <ContactUsButton noIcon isLink /> if you need higher limits.
        </>
      )}
    </Note>
  );
}

NoMorePlans.propTypes = {
  canSetupBilling: PropTypes.bool,
};
