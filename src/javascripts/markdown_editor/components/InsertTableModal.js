import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import { Modal, TextField, Button, Form } from '@contentful/forma-36-react-components';
import inRange from 'lodash/inRange';

const styles = {
  controlButton: css({
    button: {
      marginRight: tokens.spacingM
    }
  })
};

const InsertTableModal = ({ isShown, onClose }) => {
  const [rows, setRows] = useState('2');
  const [cols, setColumns] = useState('1');
  const rowsAreValid = inRange(rows, 2, 100);
  const colsAreValid = inRange(cols, 1, 100);
  return (
    <Modal title="Insert table" isShown={isShown} onClose={() => onClose(false)}>
      <Form>
        <TextField
          labelText="Number of rows"
          value={rows}
          id="insert-table-rows-number-field"
          name="rows"
          onChange={({ target: { value } }) => setRows(value)}
          textInputProps={{
            testId: 'insert-table-rows-number-field',
            min: 2,
            max: 100,
            pattern: '[1-9][0-9]*',
            type: 'number',
            width: 'small',
            autoComplete: 'off'
          }}
          validationMessage={!rowsAreValid ? 'Should be between 2 and 100' : ''}
          required
        />
        <TextField
          labelText="Number of columns"
          value={cols}
          id="insert-table-columns-number-field"
          name="columns"
          onChange={({ target: { value } }) => setColumns(value)}
          textInputProps={{
            testId: 'insert-table-columns-number-field',
            min: 1,
            max: 100,
            pattern: '[1-9][0-9]*',
            type: 'number',
            width: 'small',
            autoComplete: 'off'
          }}
          validationMessage={!colsAreValid ? 'Should be between 1 and 100' : ''}
          required
        />
      </Form>
      <div className={styles.controlButton}>
        <Button
          testId="embed-external-confirm"
          onClick={() => onClose({ rows, cols })}
          buttonType="positive"
          disabled={!rowsAreValid || !colsAreValid}>
          Insert
        </Button>
        <Button onClick={() => onClose(false)} buttonType="muted">
          Cancel
        </Button>
      </div>
    </Modal>
  );
};

InsertTableModal.propTypes = {
  isShown: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default InsertTableModal;
