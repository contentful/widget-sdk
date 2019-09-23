import React from 'react';
import PropTypes from 'prop-types';
import { EditorToolbarButton } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  root: css({
    padding: '10px',
    margin: 0,
    ':hover': {
      backgroundColor: tokens.colorElementLightest
    }
  }),
  row: css({
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  })
};

export default function AutocompleteSelection({
  onRemove,
  children,
  extraContent,
  testId = 'autocomplete-selection'
}) {
  return (
    <div className={styles.root} data-test-id={testId}>
      <div className={styles.row}>
        {children}
        <EditorToolbarButton
          label=""
          className={styles.button}
          icon="Close"
          onClick={onRemove}
          testId="autocomplete-selection.remove-button"
        />
      </div>
      <div className={styles.row}>{extraContent}</div>
    </div>
  );
}

AutocompleteSelection.propTypes = {
  onRemove: PropTypes.func.isRequired,
  extraContent: PropTypes.node,
  testId: PropTypes.string
};
