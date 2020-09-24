import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';

import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getCountryNameFromCountryCode, isCountryCode } from '../utils/countryHelper';

const styles = {
  title: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeM,
  }),
};

export const BillingInformation = ({ billingInfo }) => {
  // If the billingInfo is coming from the getBilling api call, then it's a country's name, otherwise it's from the billingForm and is a country code.
  const country = isCountryCode(billingInfo.country)
    ? getCountryNameFromCountryCode(billingInfo.country)
    : billingInfo.country;

  return (
    <div>
      <Subheading
        className={styles.title}
        element="h4"
        aria-labelledby="billing-address-information-review-section">
        Billing address
      </Subheading>
      <Paragraph>
        {billingInfo.firstName} {billingInfo.lastName}
      </Paragraph>
      <Paragraph>{billingInfo.email}</Paragraph>
      <Paragraph>{billingInfo.address}</Paragraph>
      {billingInfo.addressTwo && <Paragraph>{billingInfo.addressTwo}</Paragraph>}
      <Paragraph>
        {billingInfo.city}, {billingInfo.postcode}
      </Paragraph>
      <Paragraph>{country}</Paragraph>
      {billingInfo.vatNumber && <Paragraph>{billingInfo.vatNumber}</Paragraph>}
      {billingInfo.state && <Paragraph>{billingInfo.state}</Paragraph>}
    </div>
  );
};

BillingInformation.propTypes = {
  billingInfo: PropTypes.object.isRequired,
};
