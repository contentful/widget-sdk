import React, { useCallback } from 'react';
import {
  Heading,
  Subheading,
  Paragraph,
  Button,
  Typography,
  Tooltip,
} from '@contentful/forma-36-react-components';
import { useAsync } from 'core/hooks';
import { waitForCMInstance, openConsentManagementPanel } from 'services/OsanoService';

export default function MangeCookieConsentSection() {
  const { isLoading, error } = useAsync(useCallback(waitForCMInstance, []));

  const tooltipText =
    !isLoading && error
      ? 'The consent management script could not load. Check your content blockers.'
      : '';

  return (
    <Typography testId="manage-cookie-consent.section">
      <Heading testId="manage-cookie-consent.header">Privacy</Heading>
      <Subheading testId="manage-cookie-consent.subheader">Cookie Consent</Subheading>
      <Paragraph>
        You can set your consent preferences and determine how you want your data to be used based
        on the purposes below. You may set your preferences for us independently from those of
        third-party partners.
      </Paragraph>
      <Tooltip content={tooltipText}>
        <Button
          testId="manage-cookie-consent.button"
          onClick={openConsentManagementPanel}
          loading={isLoading}
          disabled={isLoading || error}>
          Manage consent
        </Button>
      </Tooltip>
    </Typography>
  );
}
