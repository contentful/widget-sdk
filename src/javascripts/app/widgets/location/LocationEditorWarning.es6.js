import React from 'react';
import EditorWarning from '../EditorWarning.es6';
import { Paragraph } from '@contentful/forma-36-react-components';

export default function LocationEditorWarning() {
  return (
    <EditorWarning data-error-code="field-editor-initialization">
      <Paragraph>
        Google Maps failed to load.
        <br />
        You can still edit the coordinates manually.
      </Paragraph>
    </EditorWarning>
  );
}
