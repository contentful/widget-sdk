import React from 'react';
import styles from '../styles.es6';
import CTACardComponent from './CTACardComponent.es6';
import ContactExpertIllustration from 'svg/flower-pen.es6';
import * as Intercom from 'services/intercom.es6';
import { trackClickCTA } from '../tracking.es6';

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
