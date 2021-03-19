import React, { useState } from 'react';
import {
  Button,
  Card,
  Heading,
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
  setCurrentLevel: (level: LEVEL) => Promise<any>;
}

export function EnabledFeature({ setCurrentLevel, currentLevel }: EnabledFeatureParams) {
  const [displayTurnOffDialog, setDisplayTurnOffDialog] = useState(false);
  const [displaySelectionDialog, setDisplaySelectionDialog] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLevelSelection = (newLevel: LEVEL) => {
    setDisplaySelectionDialog(false);
    setIsChanging(true);
    setCurrentLevel(newLevel).finally(() => setIsChanging(false));
  };

  const handleDisableFeature = () => {
    setIsChanging(true);
    setCurrentLevel(LEVEL.DISABLED).finally(() => setIsChanging(false));
  };

  return (
    <>
      <Card testId="settings-section-card" className={styles.section}>
        <Typography>
          <Paragraph>Asset protection level</Paragraph>
          <Heading>{LevelDescription[currentLevel]}</Heading>
          <LevelHelpText level={currentLevel} />
          <LevelHelpTable currentLevel={currentLevel} />
          <Button
            buttonType="primary"
            disabled={isChanging}
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
            disabled={isChanging}
            onClick={() => setDisplayTurnOffDialog(true)}
            testId="turn-off">
            Turn off
          </Button>
        </Typography>
      </Card>
      {displayTurnOffDialog ? (
        <TurnOffDialog
          onClose={() => setDisplayTurnOffDialog(false)}
          onSubmit={handleDisableFeature}
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
