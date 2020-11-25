import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@contentful/forma-36-react-components';

import { trackCTAClick, CTA_EVENTS } from 'analytics/trackCTA';
import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { salesUrl } from 'Config';

export const CONTACT_SALES_HREF = buildUrlWithUtmParams({
  medium: 'webapp',
  source: 'purchase-space-page',
  campaign: 'cta-enterprise-space',
  content: 'contact-us',
})(salesUrl);

function EnterpriseTalkToUs({ organizationId, handleSelect, disabled = false, testId }) {
  const handleClick = () => {
    // TODO: investigate if we still need this handleSelect prop,
    // since we can handle tracking in this component
    if (handleSelect) {
      handleSelect();
    }

    // TODO: Do we want to track this as a CTA upgrade to enterprise click as well?
    trackCTAClick(CTA_EVENTS.UPGRADE_TO_ENTERPRISE, {
      organizationId,
    });
  };

  return (
    <Button
      href={CONTACT_SALES_HREF}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      testId={testId}
      disabled={disabled}>
      Talk to us
    </Button>
  );
}
EnterpriseTalkToUs.propTypes = {
  organizationId: PropTypes.string,
  handleSelect: PropTypes.func,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
};

export { EnterpriseTalkToUs };
