import React from 'react';
import PropTypes from 'prop-types';

import { Button } from '@contentful/forma-36-react-components';

import { buildUrlWithUtmParams } from 'utils/utmBuilder';
import { salesUrl } from 'Config';

const CONTACT_SALES_HREF = buildUrlWithUtmParams({
  medium: 'webapp',
  source: 'purchase-space-page',
  campaign: 'cta-enterprise-space',
  content: 'contact-us',
})(salesUrl);

function EnterpriseTalkToUs({ handleSelect, disabled = false, testId }) {
  return (
    <Button
      href={CONTACT_SALES_HREF}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleSelect}
      testId={testId}
      disabled={disabled}>
      Talk to us
    </Button>
  );
}
EnterpriseTalkToUs.propTypes = {
  handleSelect: PropTypes.func,
  disabled: PropTypes.bool,
  testId: PropTypes.string,
};

export { EnterpriseTalkToUs };
