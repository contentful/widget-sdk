import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Modal,
  CheckboxField,
  Paragraph,
  Typography,
  Select,
  Option,
  SelectField,
  FieldGroup,
} from '@contentful/forma-36-react-components';
import { styles } from '../EmbargoedAssets.styles';
import { LEVEL, LevelDescription } from '../constants';
import { LevelHelpText } from './LevelHelpText';
import { LevelHelpTable } from './LevelHelpTable';

function labelBasedOnLevel(level: LEVEL) {
  switch (level) {
    case LEVEL.MIGRATING:
      return 'I understand that all of my assets will become immediately publicly accessible.';
    case LEVEL.UNPUBLISHED:
    case LEVEL.ALL:
      return 'I understand that existing unpublished asset URLs will cease to function within 48 hours, and my site and tooling is configured to sign secure asset URLs before use.';
    default:
      return '';
  }
}

interface TurnOffDialogParams {
  onClose: () => void;
  onSubmit: (level: LEVEL) => void;
  currentLevel: LEVEL;
}

const LevelSelectionDialog = ({ onClose, onSubmit, currentLevel }: TurnOffDialogParams) => {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const onCheckboxChange = () => setCheckboxChecked(!checkboxChecked);
  const [selectedLevel, setSelectedLevel] = useState<LEVEL>(currentLevel);

  return (
    <Modal
      className={styles.dialogSmall}
      title="Change protection level"
      size="small"
      shouldCloseOnEscapePress
      shouldCloseOnOverlayClick
      isShown
      testId="content-release-modal"
      onClose={onClose}>
      {({ title, onClose }) => (
        <>
          <Modal.Header title={title} onClose={onClose} />
          <Modal.Content>
            <Typography>
              <FieldGroup>
                <SelectField
                  id="optionSelect"
                  name="optionSelect"
                  labelText="Asset protection level"
                  onChange={(e) => {
                    setCheckboxChecked(false);
                    setSelectedLevel((e.target as HTMLSelectElement).value as LEVEL);
                  }}
                  value={currentLevel}>
                  {[LEVEL.MIGRATING, LEVEL.UNPUBLISHED, LEVEL.ALL].map((level) => (
                    <Option key={level} value={level}>
                      {LevelDescription[level]}
                    </Option>
                  ))}
                </SelectField>
              </FieldGroup>

              <LevelHelpText level={selectedLevel} />
              <LevelHelpTable currentLevel={currentLevel} selectedLevel={selectedLevel} />

              <Paragraph>
                <CheckboxField
                  id="understand-change"
                  checked={checkboxChecked}
                  labelText={labelBasedOnLevel(selectedLevel)}
                  onChange={onCheckboxChange}
                />
              </Paragraph>
              <Paragraph>
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
              </Paragraph>
            </Typography>
          </Modal.Content>
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
