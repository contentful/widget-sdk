import { ContentTypeForm } from './ContentTypeForm';
import { Note } from '@contentful/forma-36-react-components';
import PropTypes from 'prop-types';
import React from 'react';

export function DuplicateContentTypeForm(props) {
  return (
    <ContentTypeForm
      {...props}
      title="Duplicate content type"
      confirmLabel="Duplicate"
      cancelLabel="Cancel"
      namePlaceholder={`Duplicate of "${props.originalName}"`}>
      <Note testId="duplicate-content-type-note">
        You&apos;re about to duplicate the content type <strong>{props.originalName}</strong> with
        all existing fields. No entries will be duplicated.
      </Note>
    </ContentTypeForm>
  );
}

DuplicateContentTypeForm.propTypes = {
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  originalName: PropTypes.string.isRequired,
};
