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
import { LEVEL, Level, levelDescription, SwitchableLevel } from '../constants';
import { LevelHelpTable } from './LevelHelpTable';

interface EnabledFeatureParams {
  currentLevel: SwitchableLevel;
  setCurrentLevel: (level: Level) => Promise<void>;
}

export function EnabledFeature({ setCurrentLevel, currentLevel }: EnabledFeatureParams) {
  const [displayTurnOffDialog, setDisplayTurnOffDialog] = useState(false);
  const [displaySelectionDialog, setDisplaySelectionDialog] = useState(false);
  const [isChanging, setIsChanging] = useState(false);

  const handleLevelSelection = (newLevel: Level) => {
    setDisplaySelectionDialog(false);
    setIsChanging(true);
    setCurrentLevel(newLevel).finally(() => setIsChanging(false));
  };

  const handleDisableFeature = () => {
    setDisplayTurnOffDialog(false);
    setIsChanging(true);
    setCurrentLevel(LEVEL.DISABLED).finally(() => setIsChanging(false));
  };

  return (
    <>
      <Card testId="settings-section-card" className={styles.section}>
        <Typography>
          <Paragraph>Asset protection level</Paragraph>
          <Heading testId="embargoed-assets-current-mode">{levelDescription[currentLevel]}</Heading>
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
            Restrict access to media by using cryptographically signed time-limited asset URLs. You
            can protect only unpublished assets or all assets.
          </Paragraph>
          <DocumentationTextLink />
        </Typography>
      </Card>
      <Card testId="danger-zone-section-card" className={styles.section}>
        <Typography>
          <Heading>Turn off embargoed assets</Heading>
          <Paragraph>All assets will become unprotected and publicly accessible.</Paragraph>
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