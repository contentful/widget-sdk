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

const PublicationNote = ({ publications, entityTitle, referencesCount }) => {
  if (!publications) {
    return null;
  }

  const noteType = publications.succeed ? 'positive' : 'negative';
  const testId = `cf-ui-note-publication-${publications.succeed ? 'success' : 'failed'}`;
  const noteText = publications.succeed
    ? `${entityTitle} and all ${referencesCount} references were published successfully.`
    : `We were unable to publish ${entityTitle} and its references.`;

  return (
    <Note noteType={noteType} className={styles.validationNote} testId={testId}>
      {noteText}
    </Note>
  );
};

PublicationNote.propTypes = {
  entityTitle: PropTypes.string,
  referencesCount: PropTypes.number,
  publications: PropTypes.shape({
    succeed: PropTypes.bool,
  }),
};

export default PublicationNote;
