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
} from '@contentful/forma-36-react-components';
import { styles } from '../EmbargoedAssets.styles';
import { LEVEL } from '../constants';
import { LevelHelpText } from './LevelHelpText';
import { LevelHelpTable } from './LevelHelpTable';

function labelBasedOnLevel(level: LEVEL) {
  switch (level) {
    case LEVEL.MIGRATING:
      return 'I understand that all of my assets will become immediately publicly accessible.';
    case LEVEL.UNPUBLISHED:
      return 'I understand that existing unpublished asset URLs will cease to function within 48 hours, and my site and tooling is configured to sign secure asset URLs before use.';
    case LEVEL.ALL:
      return 'I understand that existing unpublished asset URLs will cease to function within 48 hours, and my site and tooling is configured to sign secure asset URLs before use.';
    default:
      return '';
  }
}

interface TurnOffDialogParams {
  onClose: () => void;
  onSubmit: () => void;
  currentLevel: LEVEL;
}

const LevelSelectionDialog = ({ onClose, onSubmit, currentLevel }: TurnOffDialogParams) => {
  const [checkboxChecked, setCheckboxChecked] = useState(false);
  const onCheckboxChange = () => setCheckboxChecked(!checkboxChecked);
  const [selectedLevel, setSelectedLevel] = useState<LEVEL>(LEVEL.MIGRATING);
  const selectionChanged = (value) => {
    setSelectedLevel(value.target.value);
  };

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
              <Paragraph element="h6">Asset protection level</Paragraph>

              <Paragraph>
                <Select
                  id="optionSelect"
                  name="optionSelect"
                  onChange={selectionChanged}
                  value={currentLevel}>
                  <Option value={LEVEL.MIGRATING}>Preparation mode</Option>
                  <Option value={LEVEL.UNPUBLISHED}>Unpublished assets protected</Option>
                  <Option value={LEVEL.ALL}>Unpublished assets protected</Option>
                </Select>
              </Paragraph>

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
                  onClick={onSubmit}
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
