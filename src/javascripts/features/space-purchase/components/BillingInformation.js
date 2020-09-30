import React from 'react';
import { css } from 'emotion';

import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { BillingDetailsPropType } from 'features/organization-billing';

const styles = {
  title: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeM,
  }),
};

export const BillingInformation = ({ billingDetails }) => {
  return (
    <div>
      <Subheading
        className={styles.title}
        element="h4"
        aria-labelledby="billing-address-information-review-section">
        Billing address
      </Subheading>
      <Paragraph>
        {billingDetails.firstName} {billingDetails.lastName}
      </Paragraph>
      <Paragraph>{billingDetails.workEmail}</Paragraph>
      <Paragraph>{billingDetails.address1}</Paragraph>
      {billingDetails.address2 && <Paragraph>{billingDetails.address2}</Paragraph>}
      <Paragraph>
        {billingDetails.city}, {billingDetails.zipCode}
      </Paragraph>
      <Paragraph>{billingDetails.country}</Paragraph>
      {billingDetails.vat && <Paragraph>{billingDetails.vat}</Paragraph>}
      {billingDetails.state && <Paragraph>{billingDetails.state}</Paragraph>}
    </div>
  );
};

BillingInformation.propTypes = {
  billingDetails: BillingDetailsPropType.isRequired,
};
