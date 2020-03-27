import React, { useCallback } from 'react';
import {
  Heading,
  Subheading,
  Paragraph,
  Button,
  Typography,
} from '@contentful/forma-36-react-components';
import * as logger from 'services/logger';
import useAsync from 'app/common/hooks/useAsync';
import { waitForCMInstance, openConsentManagementPanel } from 'services/OsanoService';

export default function MangeCookieConsentSection() {
  const { isLoading, error } = useAsync(
    useCallback(async () => {
      try {
        await waitForCMInstance();
      } catch (error) {
        logger.logError('Could not load Osano', { error });
        // We throw the error here so that useAsync() knows that an error occured and the Promise did not resolve successfully
        throw error;
      }
    }, [])
  );

  return (
    <Typography testId="manage-cookie-consent.section">
      <Heading testId="manage-cookie-consent.header">Privacy</Heading>
      <Subheading testId="manage-cookie-consent.subheader">Cookie Consent</Subheading>
      <Paragraph>
        You can set your consent preferences and determine how you want your data to be used based
        on the purposes below. You may set your preferences for us independently from those of
        third-party partners.
      </Paragraph>
      <Button
        testId="manage-cookie-consent.button"
        onClick={openConsentManagementPanel}
        loading={isLoading}
        disabled={isLoading || error}>
        Manage consent
      </Button>
    </Typography>
  );
}
