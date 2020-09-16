import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import cn from 'classnames';

import { Paragraph, Subheading } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { getCountryNameFromCountryCode } from '../utils/countryHelper';

const styles = {
  title: css({
    fontWeight: tokens.fontWeightMedium,
    fontSize: tokens.fontSizeM,
  }),
  fontColor: css({
    color: tokens.colorTextDark,
  }),
};

export const BillingInformation = ({ billingInfo }) => {
  return (
    <div>
      <Subheading
        className={cn(styles.title, styles.fontColor)}
        element="h4"
        aria-labelledby="billing-address-information-review-section">
        Billing address
      </Subheading>
      <Paragraph className={styles.fontColor}>
        {billingInfo.firstName} {billingInfo.lastName}
      </Paragraph>
      <Paragraph className={styles.fontColor}>{billingInfo.email}</Paragraph>
      <Paragraph className={styles.fontColor}>{billingInfo.address}</Paragraph>
      {billingInfo.addressTwo && (
        <Paragraph className={styles.fontColor}>{billingInfo.addressTwo}</Paragraph>
      )}
      <Paragraph className={styles.fontColor}>
        {billingInfo.city}, {billingInfo.postcode}
      </Paragraph>
      <Paragraph className={styles.fontColor}>
        {getCountryNameFromCountryCode(billingInfo.country)}
      </Paragraph>
      {billingInfo.vatNumber && (
        <Paragraph className={styles.fontColor}>{billingInfo.vatNumber}</Paragraph>
      )}
    </div>
  );
};

BillingInformation.propTypes = {
  billingInfo: PropTypes.object.isRequired,
};
