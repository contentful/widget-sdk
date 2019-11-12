import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Modal, Button, Tooltip, DisplayText } from '@contentful/forma-36-react-components';
import specialCharacters from '../markdown_special_characters';

const styles = {
  buttonPanel: css({
    display: 'flex',
    flexWrap: 'wrap'
  }),
  charButton: css({
    border: `1px solid ${tokens.colorElementDarkest}`,
    width: '4.1rem',
    height: '4.1rem',
    fontSize: tokens.fontSizeXl,
    marginTop: tokens.spacing2Xs,
    marginRight: tokens.spacing2Xs
  }),
  selectedCharButton: css({
    backgroundColor: tokens.colorElementLightest
  }),
  tooltip: css({ zIndex: 1000 }),
  button: css({
    marginTop: tokens.spacingM,
    marginRight: tokens.spacingS
  }),
  charContainer: css({
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    marginBottom: tokens.spacingM
  }),
  selectedCharacter: css({
    fontSize: tokens.fontSize3Xl,
    margin: 'auto'
  }),
  selectedCharacterDesc: css({
    fontSize: tokens.fontSizeM,
    margin: 'auto'
  })
};

const InsertCharacterModal = ({ isShown, onClose }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(specialCharacters[0]);
  return (
    <Modal
      size="large"
      title="Insert special character"
      isShown={isShown}
      onClose={() => onClose(false)}>
      <div className={styles.charContainer}>
        <DisplayText element="p" className={styles.selectedCharacter}>
          {String.fromCharCode(selectedCharacter.code)}
        </DisplayText>
        <DisplayText element="p" className={styles.selectedCharacterDesc}>
          {selectedCharacter.desc}
        </DisplayText>
      </div>
      <div className={styles.buttonPanel}>
        {specialCharacters.map((char, index) => (
          <div key={index}>
            <Tooltip className={styles.tooltip} content={char.desc}>
              <Button
                isActive={char.code === selectedCharacter.code}
                className={styles.charButton}
                buttonType="naked"
                onClick={() => setSelectedCharacter(char)}>
                {String.fromCharCode(char.code)}
              </Button>
            </Tooltip>
          </div>
        ))}
      </div>
      <Button
        className={styles.button}
        testId="insert-link-confirm"
        onClick={() => onClose(String.fromCharCode(selectedCharacter.code))}
        buttonType="positive">
        Insert selected
      </Button>
      <Button className={styles.button} onClick={() => onClose(false)} buttonType="muted">
        Cancel
      </Button>
    </Modal>
  );
};

InsertCharacterModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default InsertCharacterModal;
