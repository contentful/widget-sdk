import React from 'react';
import {
  Button,
  Card,
  Heading,
  Notification,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';
import SafeIcon from 'svg/safe.svg';

import { styles } from '../EmbargoedAssets.styles';
import { DocumentationTextLink } from './DocumentationTextLink';
import { LEVEL } from '../constants';

interface DisabledFeatureParams {
  setCurrentLevel?: (level: LEVEL) => void;
}

export function DisabledFeature({ setCurrentLevel }: DisabledFeatureParams) {
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
        {setCurrentLevel ? (
          <Button
            buttonType="primary"
            onClick={() => {
              setCurrentLevel(LEVEL.MIGRATING);
              Notification.success(
                ((
                  <>
                    <Paragraph className={styles.bolder}>Preparation mode activated</Paragraph>
                    <Paragraph>Use this mode to set up your assets to be protected.</Paragraph>
                  </>
                ) as unknown) as string
              );
            }}
            testId="turn-off">
            Get started
          </Button>
        ) : (
          <Button href="https://www.contentful.com/support/?upgrade-teams=true">
            Get in touch
          </Button>
        )}
      </Typography>
    </Card>
  );
}
