import React from 'react';
import { Note } from '@contentful/forma-36-react-components';

export default function LocationEditorWarning() {
  return (
    <Note noteType="warning" testId="field-editor-initialization">
      Google Maps failed to load.
      <br />
      You can still edit the coordinates manually.
    </Note>
  );
}
