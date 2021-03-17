import React from 'react';
import {
  Button,
  Card,
  Heading,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';
import SafeIcon from 'svg/safe.svg';

import { styles } from '../EmbargoedAssets.styles';
import { DocumentationTextLink } from './DocumentationTextLink';

interface DisabledFeatureParams {
  onClick: () => void;
  primaryText: string;
}

export function DisabledFeature({ onClick, primaryText }: DisabledFeatureParams) {
  return (
    <Card testId="danger-zone-section-card" className={styles.sectionWide}>
      <Typography className={styles.centered}>
        <SafeIcon />
        <Heading>Protect your assets with secure URLs</Heading>
        <Paragraph>
          Restrict access to media by signing requests to the CDN with a valid token and policy.
          Secured asset URLs are used to access assets via the Delivery, Management or Preview API.
        </Paragraph>
        <Paragraph>
          <DocumentationTextLink />
        </Paragraph>
        <Button buttonType="primary" onClick={onClick} testId="turn-off">
          {primaryText}
        </Button>
      </Typography>
    </Card>
  );
}
