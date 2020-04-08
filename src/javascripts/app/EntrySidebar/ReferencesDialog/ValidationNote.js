import React from 'react';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import { Note } from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';

const styles = {
  validationNote: css({
    margin: `${tokens.spacingM} 0`,
  }),
};

const ValidationNote = ({ validations }) => {
  if (!validations) {
    return null;
  }

  const hasValidationErrors = !!validations.errored.length;

  const noteType = hasValidationErrors ? 'negative' : 'positive';
  const testId = `cf-ui-note-validation-${hasValidationErrors ? 'failed' : 'success'}`;
  const noteText = hasValidationErrors
    ? 'Some references did not pass validation'
    : 'All references passed validation';

  return (
    <Note noteType={noteType} className={styles.validationNote} testId={testId}>
      {noteText}
    </Note>
  );
};

ValidationNote.propTypes = {
  validations: PropTypes.shape({
    errored: PropTypes.array,
  }),
};

export default ValidationNote;
