import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  CheckboxField,
  Paragraph,
  Typography,
  Option,
  SelectField,
  FieldGroup,
} from '@contentful/forma-36-react-components';
import { styles } from '../EmbargoedAssets.styles';
import { confirmLabelByLevel, LEVEL, levelDescription } from '../constants';
import { LevelHelpText } from './LevelHelpText';
import { LevelHelpTable } from './LevelHelpTable';

interface TurnOffDialogParams {
  onClose: () => void;
  onSubmit: (level: LEVEL) => void;
  currentLevel: LEVEL;
}

const LevelSelectionDialog = ({ onClose, onSubmit, currentLevel }: TurnOffDialogParams) => {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<LEVEL>(currentLevel);

  const levelIsDifferent = currentLevel !== selectedLevel;

  return (
    <Modal
      className={styles.dialogSmall}
      title="Change protection level"
      size="small"
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick
      isShown
      testId="change-protection-modal"
      onClose={onClose}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <FieldGroup>
              <SelectField
                id="asset-protection-level"
                name="asset-protection-level"
                testId="asset-protection-level"
                labelText="Asset protection level"
                onChange={(e) => {
                  setCheckboxChecked(false);
                  setSelectedLevel((e.target as HTMLSelectElement).value as LEVEL);
                }}
                value={currentLevel}>
                {[LEVEL.MIGRATING, LEVEL.UNPUBLISHED, LEVEL.ALL].map((level) => (
                  <Option key={level} value={level}>
                    {levelDescription[level]}
                    {level === currentLevel ? ' (active)' : null}
                  </Option>
                ))}
              </SelectField>
            </FieldGroup>

            <LevelHelpText level={selectedLevel} />
            <LevelHelpTable currentLevel={currentLevel} selectedLevel={selectedLevel} />

            {levelIsDifferent ? (
              <CheckboxField
                id="understand-change"
                checked={checkboxChecked}
                labelText={confirmLabelByLevel[selectedLevel]}
                onChange={() => setCheckboxChecked(!checkboxChecked)}
              />
            ) : null}
          </Modal.Content>
          <Modal.Controls>
            <Button
              buttonType="positive"
              disabled={!checkboxChecked}
              onClick={() => onSubmit(selectedLevel)}
              className={styles.marginRight}>
              Save changes
            </Button>
            <Button buttonType="muted" onClick={onClose}>
              Cancel
            </Button>
          </Modal.Controls>
        </>
      )}
    </Modal>
  );
};

LevelSelectionDialog.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export { LevelSelectionDialog };
