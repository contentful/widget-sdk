import React from 'react';
import PropTypes from 'prop-types';

import { TextLink, Paragraph, Note } from '@contentful/forma-36-react-components';

export default function BillingInfo(props) {
  const { canSetupBilling, goToBilling } = props;

  return (
    <Note>
      {canSetupBilling && (
        <Paragraph>
          <TextLink onClick={goToBilling}>Add payment details</TextLink> for the organization before
          creating a paid space.
        </Paragraph>
      )}
      {!canSetupBilling && (
        <Paragraph>
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
