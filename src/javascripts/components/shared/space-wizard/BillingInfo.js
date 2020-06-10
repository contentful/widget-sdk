import React from 'react';
import PropTypes from 'prop-types';
import { Note } from '@contentful/forma-36-react-components';

import { TextLink } from '@contentful/forma-36-react-components';

function BillingInfo({ action, goToBilling, canSetupBilling = false }) {
  return (
    <Note noteType="warning">
      {canSetupBilling ? (
        <>
          <TextLink onClick={goToBilling}>Add payment details</TextLink> for the organization{' '}
        </>
      ) : (
        <>The owner of this organization needs to add payment details </>
      )}
      {action === 'create' ? 'before creating a paid space.' : 'before changing a space.'}
    </Note>
  );
}

BillingInfo.propTypes = {
  action: PropTypes.oneOf(['create', 'change']),
  goToBilling: PropTypes.func.isRequired,
  canSetupBilling: PropTypes.bool,
};

export default BillingInfo;
