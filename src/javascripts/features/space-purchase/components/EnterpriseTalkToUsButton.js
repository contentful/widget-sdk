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

function EnterpriseTalkToUsButton({
  organizationId,
  onSelect,
  disabled = false,
  testId = 'enterprise-talk-to-us',
}) {
  const handleClick = () => {
    // TODO: investigate if we still need this onSelect prop,
    // since we can handle tracking in this component
    if (onSelect) {
      onSelect();
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
      buttonType="muted"
      onClick={handleClick}
      testId={testId}
      disabled={disabled}>
      Talk to us
    </Button>
  );
}
EnterpriseTalkToUsButton.propTypes = {
  organizationId: PropTypes.string,
  onSelect: PropTypes.func,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
};

export { EnterpriseTalkToUsButton };
