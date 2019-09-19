import React from 'react';
import PropTypes from 'prop-types';
import { IconButton } from '@contentful/forma-36-react-components';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  root: css({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '5px 10px',
    margin: 0,
    alignItems: 'center',
    ':hover': {
      backgroundColor: tokens.colorElementLightest
    }
  }),
  button: css({})
};

export default function AutocompleteSelection({
  onRemove,
  children,
  testId = 'autocomplete-selection'
}) {
  return (
    <div className={styles.root} data-test-id={testId}>
      {children}
      <IconButton
        className={styles.button}
        buttonType="secondary"
        iconProps={{ icon: 'Close' }}
        onClick={onRemove}
        label="Remove item"
        testId="autocomplete-selection.remove-button"
      />
    </div>
  );
}

AutocompleteSelection.propTypes = {
  onRemove: PropTypes.func.isRequired,
  testId: PropTypes.string
};
