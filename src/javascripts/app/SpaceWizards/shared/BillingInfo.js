import React from 'react';
import PropTypes from 'prop-types';

import { TextLink, Note } from '@contentful/forma-36-react-components';

export default function BillingInfo({ canSetupBilling, goToBilling }) {
  return (
    <Note noteType="warning" testId="billing-info-note">
      {canSetupBilling ? (
        <>
          <TextLink onClick={goToBilling} testId="go-to-billing-link">
            Add payment details
          </TextLink>{' '}
          for the organization before creating a paid space.
        </>
      ) : (
        <span data-test-id="payment-details-missing">
          The owner of this organization needs to add payment details before you can create a paid
          space.
        </span>
      )}
    </Note>
  );
}

BillingInfo.propTypes = {
  goToBilling: PropTypes.func.isRequired,
  canSetupBilling: PropTypes.bool,
};
