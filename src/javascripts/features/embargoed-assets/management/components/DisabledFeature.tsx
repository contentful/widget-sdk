import React, { useState } from 'react';
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
import { EnabledLevel, LEVEL, SwitchableLevel } from '../constants';

interface DisabledFeatureParams {
  setCurrentLevel?: (level: SwitchableLevel | EnabledLevel) => Promise<void>;
}

export function DisabledFeature({ setCurrentLevel }: DisabledFeatureParams) {
  const [isChanging, setIsChanging] = useState(false);

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
            disabled={isChanging}
            onClick={() => {
              setIsChanging(true);
              setCurrentLevel(LEVEL.ENABLED).finally(() => setIsChanging(false));
            }}
            testId="get-started">
            Get started
          </Button>
        ) : (
          <Button
            testId="get-in-touch"
            href="https://www.contentful.com/support/?upgrade-teams=true"
            target="_blank"
            rel="noopener noreferrer">
            Get in touch
          </Button>
        )}
      </Typography>
    </Card>
  );
}
