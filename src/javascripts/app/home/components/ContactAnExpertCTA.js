import React from 'react';
import styles from '../styles';
import CTACardComponent from './CTACardComponent';
import ContactExpertIllustration from 'svg/illustrations/flower-pen.svg';
import * as Intercom from 'services/intercom';
import { trackClickCTA } from '../tracking';

const ContactAnExpertCTA = () => {
  const onClick = () => {
    trackClickCTA('contact_sales_button');

    Intercom.open();
  };
  return (
    <CTACardComponent
      heading="Questions? Contact an expert"
      description="Projects often launch faster with guidance from a Contentful expert."
      ctaLabel="Contact an expert"
      onClick={onClick}
      illustration={<ContactExpertIllustration className={styles.svgContainerContact} />}
    />
  );
};

export default ContactAnExpertCTA;
