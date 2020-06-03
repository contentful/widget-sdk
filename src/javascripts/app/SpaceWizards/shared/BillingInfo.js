import React from 'react';
import PropTypes from 'prop-types';

import { TextLink, Paragraph, Note } from '@contentful/forma-36-react-components';

export default function BillingInfo(props) {
  const { canSetupBilling, goToBilling } = props;

  return (
    <Note testId="billing-info-note">
      {canSetupBilling && (
        <Paragraph>
          <TextLink testId="go-to-billing-link" onClick={goToBilling}>
            Add payment details
          </TextLink>{' '}
          for the organization before creating a paid space.
        </Paragraph>
      )}
      {!canSetupBilling && (
        <Paragraph testId="payment-details-missing">
          The owner of this organization needs to add payment details before you can create a paid
          space.
        </Paragraph>
      )}
    </Note>
  );
}

BillingInfo.propTypes = {
  canSetupBilling: PropTypes.bool.isRequired,
  goToBilling: PropTypes.func.isRequired,
};
