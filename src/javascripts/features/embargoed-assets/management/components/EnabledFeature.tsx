import React, { useState } from 'react';
import {
  Button,
  Card,
  Heading,
  Notification,
  Paragraph,
  Typography,
} from '@contentful/forma-36-react-components';

import { styles } from '../EmbargoedAssets.styles';
import { DocumentationTextLink } from './DocumentationTextLink';
import { TurnOffDialog } from './TurnOffDialog';
import { LevelSelectionDialog } from './LevelSelectionDialog';
import { LevelHelpText } from './LevelHelpText';
import { LEVEL, LevelDescription } from '../constants';
import { LevelHelpTable } from './LevelHelpTable';

interface EnabledFeatureParams {
  currentLevel: LEVEL;
  setCurrentLevel: (level: LEVEL) => void;
}

export function EnabledFeature({ setCurrentLevel, currentLevel }: EnabledFeatureParams) {
  const [displayTurnOffDialog, setDisplayTurnOffDialog] = useState(false);
  const [displaySelectionDialog, setDisplaySelectionDialog] = useState(false);

  const handleLevelSelection = (newLevel: LEVEL) => {
    setCurrentLevel(newLevel);
    setDisplaySelectionDialog(false);
    Notification.success(LevelDescription[newLevel]);
  };

  return (
    <>
      <Card testId="settings-section-card" className={styles.section}>
        <Typography>
          <Paragraph>Asset protection level</Paragraph>
          <Heading>{LevelDescription[currentLevel]}</Heading>
          <LevelHelpText level={LEVEL.MIGRATING} />
          <LevelHelpTable currentLevel={currentLevel} />
          <Button
            buttonType="primary"
            onClick={() => setDisplaySelectionDialog(true)}
            testId="turn-on">
            Change protection level
          </Button>
        </Typography>
      </Card>
      <Card testId="documentation-section-card" className={styles.section}>
        <Typography>
          <Heading>Documentation</Heading>
          <Paragraph>
            Restrict access to media by signing requests to the CDN with a valid token and policy.
            The secured asset URLs are then used to access assets via the Delivery, Management or
            Preview API.
          </Paragraph>
          <DocumentationTextLink />
        </Typography>
      </Card>
      <Card testId="danger-zone-section-card" className={styles.section}>
        <Typography>
          <Heading>Turn off embargoed assets</Heading>
          <Paragraph>All assets will become unprotected and accessible.</Paragraph>
          <Button
            buttonType="muted"
            onClick={() => setDisplayTurnOffDialog(true)}
            testId="turn-off">
            Turn off
          </Button>
        </Typography>
      </Card>
      {displayTurnOffDialog ? (
        <TurnOffDialog
          onClose={() => setDisplayTurnOffDialog(false)}
          onSubmit={() => setCurrentLevel(LEVEL.DISABLED)}
        />
      ) : null}
      {displaySelectionDialog ? (
        <LevelSelectionDialog
          onClose={() => setDisplaySelectionDialog(false)}
          currentLevel={currentLevel}
          onSubmit={handleLevelSelection}
        />
      ) : null}
    </>
  );
}
